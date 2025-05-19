'use client'

import { useAppStore } from '@/stores/app.store'
import { useApiStore } from '@/stores/api.store'
import { useEffect, useRef, useState } from 'react'
import { AmmTrade } from '@/interfaces'
import numeral from 'numeral'
import { cleanOutput, cn } from '@/utils'
import { OrderbookOption, OrderbookSide } from '@/enums'
import StyledTooltip from '@/components/common/StyledTooltip'

// todo: make it dynamic
const ROWS_TO_SHOW = 11

function EmptyBook(side: OrderbookSide) {
    return (
        <div className="flex flex-col w-full gap-1 bg-gray-500/5 pr-4">
            {Array(ROWS_TO_SHOW)
                .fill(0)
                .map((bid, bidIndex) => {
                    return (
                        <div
                            key={`${bidIndex}-${bid.amount}`}
                            className={`relative group skeleton-loading h-5 !rounded-none ${side === OrderbookSide.ASK ? '!bg-folly/10' : '!bg-aquamarine/10'}`}
                            style={{
                                width: `${Math.round(((side === OrderbookSide.ASK ? ROWS_TO_SHOW - bidIndex : bidIndex + 1) / ROWS_TO_SHOW) * 100)}%`,
                            }}
                        />
                    )
                })}
        </div>
    )
}

// todo: improve this v poorly designed code asap
export default function OrderbookSection() {
    const { currentChainId, selectedTrade, sellToken, buyToken, filterOutSolverInconsistencies, getAddressPair, setHoveredOrderbookTrade } =
        useAppStore()
    const { apiStoreRefreshedAt, metrics, actions } = useApiStore()
    const [asks, setAsks] = useState<AmmTrade[]>([])
    const [bids, setBids] = useState<AmmTrade[]>([])
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
    const [blockFlash, setBlockFlash] = useState(false)
    const lastBlockRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        if (!metrics) {
            setBids([])
            setAsks([])
            return
        }

        // get possibly undefined orderbook
        const orderbook = actions.getOrderbook(getAddressPair())
        if (orderbook?.bids && orderbook?.asks) {
            let sortedAsks = orderbook?.asks.sort(
                (curr, next) => curr.amount * (1 / curr.average_sell_price) - next.amount * (1 / next.average_sell_price),
            )
            let sortedBids = orderbook?.bids.sort((curr, next) => curr.average_sell_price * curr.amount - next.average_sell_price * next.amount)

            // filter out inconsistencies
            if (filterOutSolverInconsistencies === OrderbookOption.YES) {
                sortedAsks = sortedAsks.filter((curr, currIndex, all) =>
                    currIndex + 1 < all.length ? 1 / curr.average_sell_price < 1 / all[currIndex + 1].average_sell_price : true,
                )
                sortedBids = sortedBids.filter((curr, currIndex, all) =>
                    currIndex + 1 < all.length ? curr.average_sell_price > all[currIndex + 1].average_sell_price : true,
                )
            }

            // update state
            setAsks(sortedAsks)
            setBids(sortedBids)
        } else {
            setBids([])
            setAsks([])
        }

        // flash
        if (metrics?.block !== undefined && metrics.block !== lastBlockRef.current) {
            setBlockFlash(true)
            lastBlockRef.current = metrics.block
            const timeout = setTimeout(() => setBlockFlash(false), 300)
            return () => clearTimeout(timeout)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentChainId, metrics, apiStoreRefreshedAt, selectedTrade])

    return (
        <div className="flex flex-col w-full border rounded-xl py-3 border-milk-100 gap-1 bg-milk-50 backdrop-blur-xl">
            <div className="flex gap-1 items-center rounded-lg px-4 py-1.5">
                <p className="text-milk text-base font-semibold">Orderbook</p>
            </div>
            <div className="flex flex-col gap-1 text-xs w-full">
                {/* headers */}
                <div className="grid grid-cols-3 px-4 py-0.5 text-milk-400">
                    <p>
                        Price ({sellToken.symbol}/{buyToken.symbol})
                    </p>
                    <p className="ml-auto truncate">Size ({sellToken.symbol})</p>
                    <p className="ml-auto truncate">Total ({sellToken.symbol})</p>
                </div>

                {/* asks */}
                {asks.length
                    ? asks
                          .slice(0, ROWS_TO_SHOW)
                          .reverse()
                          .map((ask, askIndex, slicedAsks) => {
                              const totalRow = slicedAsks.reduce((acc, curr, currIndex) => (acc += currIndex >= askIndex ? curr.output : 0), 0)
                              const totalAsks = slicedAsks.reduce((acc, curr) => (acc += curr.output), 0)
                              const percentage = Math.max(Math.round((totalRow / totalAsks) * 100), 0.5) // min 0.5% to show a beginning of bar
                              return (
                                  <div
                                      key={`${askIndex}-${ask.amount}`}
                                      className="relative group w-full hover:bg-milk-150 hover:font-semibold overflow-hidden"
                                      onMouseEnter={() => setHoveredOrderbookTrade(ask)}
                                      onMouseLeave={() => {
                                          if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
                                          debounceTimeout.current = setTimeout(() => {
                                              setHoveredOrderbookTrade(undefined)
                                          }, 600)
                                      }}
                                  >
                                      <div
                                          className={cn('bg-folly/10 group-hover:bg-folly/30 absolute h-full', {
                                              'animate-flash bg-folly/50': blockFlash,
                                          })}
                                          style={{ width: `${percentage}%` }}
                                      />
                                      <div className="grid grid-cols-3 px-4 py-0.5">
                                          <p className="text-folly">{cleanOutput(numeral(1 / ask.average_sell_price).format('0,0.[00000000]'))}</p>
                                          <p className="ml-auto truncate">{cleanOutput(numeral(ask.output).format('0,0.[0000]'))}</p>
                                          <p className="ml-auto truncate">{cleanOutput(numeral(totalRow).format('0,0.[0000]'))}</p>
                                      </div>
                                  </div>
                              )
                          })
                    : EmptyBook(OrderbookSide.ASK)}

                {/* spread */}
                <div className="grid grid-cols-3 w-full bg-milk-150 font-semibold px-4 py-0.5">
                    <p className="col-span-1 mx-auto">Spread</p>
                    {metrics?.precomputedMetrics && asks.length && bids.length ? (
                        <StyledTooltip
                            placement="bottom"
                            content={
                                <div className="flex flex-col">
                                    <p>
                                        Best ask: {numeral(1).divide(asks[0].average_sell_price).format('0,0.[0000000]')} {sellToken.symbol}/
                                        {buyToken.symbol}
                                    </p>
                                    <p>
                                        Best bid: {numeral(bids[0].average_sell_price).format('0,0.[0000000]')} {buyToken.symbol}/{sellToken.symbol}
                                    </p>
                                </div>
                            }
                            className="max-w-80"
                            disableAnimation
                        >
                            {/* todo: improve this */}
                            <p className="mx-auto truncate">
                                {/* {cleanOutput(
                                    numeral(1).divide(asks[0].average_sell_price).subtract(bids[0].average_sell_price).format('0,0.[0000000]'),
                                )} */}
                                {/* {numeral(1 / asks[0].average_sell_price)
                                    .subtract(bids[0].average_sell_price)
                                    .format('0,0.[0000000]')} */}
                                {parseFloat(String(1 / asks[0].average_sell_price - bids[0].average_sell_price)).toFixed(10)}
                            </p>
                        </StyledTooltip>
                    ) : (
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading mx-4">
                            <p className="text-milk-100 font-semibold mx-auto">-.--</p>
                        </div>
                    )}
                    {metrics && !isNaN(Number(metrics?.spreadPercent)) ? (
                        <p className="mx-auto truncate">
                            {numeral(metrics?.spreadPercent).format('0,0.[0000]%')}{' '}
                            <span className="pl-1 text-milk-400 text-xs">
                                {cleanOutput(numeral(metrics.spreadPercent).multiply(10000).format('0,0'))} bp
                                {Math.abs(Number(metrics.spreadPercent)) * 10000 >= 1.5 ? 's' : ''}
                            </span>
                        </p>
                    ) : (
                        <div className="flex gap-1.5 items-center flex-wrap skeleton-loading mx-4">
                            <p className="text-milk-100 font-semibold mx-auto">-.--%</p>
                        </div>
                    )}
                </div>

                {/* bids */}
                {bids.length
                    ? bids.slice(0, ROWS_TO_SHOW).map((bid, bidIndex, slicedBids) => {
                          const totalRow = slicedBids.reduce((acc, curr, currIndex) => (acc += currIndex <= bidIndex ? curr.amount : 0), 0)
                          const totalBids = slicedBids.reduce((acc, curr) => (acc += curr.amount), 0)
                          const percentage = Math.max(Math.round((totalRow / totalBids) * 100), 0.5) // min 0.5% to show a beginning of bar
                          return (
                              <div
                                  key={`${bidIndex}-${bid.amount}`}
                                  className="relative group w-full hover:bg-milk-150 hover:font-semibold overflow-hidden"
                                  onMouseEnter={() => setHoveredOrderbookTrade(bid)}
                                  onMouseLeave={() => {
                                      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
                                      debounceTimeout.current = setTimeout(() => {
                                          setHoveredOrderbookTrade(undefined)
                                      }, 600)
                                  }}
                              >
                                  <div
                                      className={cn('bg-aquamarine/10 group-hover:bg-aquamarine/30 absolute h-full', {
                                          'animate-flash bg-aquamarine/50': blockFlash,
                                      })}
                                      style={{ width: `${percentage}%` }}
                                  />
                                  <div className="grid grid-cols-3 px-4 py-0.5">
                                      <p className="text-aquamarine">{cleanOutput(numeral(bid.average_sell_price).format('0,0.[00000000]'))}</p>
                                      <p className="ml-auto truncate">{cleanOutput(numeral(bid.amount).format('0,0.[0000]'))}</p>
                                      <p className="ml-auto truncate">{cleanOutput(numeral(totalRow).format('0,0.[0000]'))}</p>
                                  </div>
                              </div>
                          )
                      })
                    : EmptyBook(OrderbookSide.BID)}
            </div>
        </div>
    )
}
