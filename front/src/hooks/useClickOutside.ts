import { RefObject, useEffect, useCallback } from 'react'

type EventType = MouseEvent | TouchEvent
type Handler = (event: EventType) => void

export const useClickOutside = <T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: Handler,
    options: {
        enabled?: boolean
        eventTypes?: Array<'mousedown' | 'touchstart'>
    } = {},
): void => {
    const { enabled = true, eventTypes = ['mousedown', 'touchstart'] } = options

    const handleClickOutside = useCallback(
        (event: EventType) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler(event)
        },
        [ref, handler],
    )

    useEffect(() => {
        if (!enabled) return

        eventTypes.forEach((eventType) => {
            document.addEventListener(eventType, handleClickOutside)
        })

        return () => {
            eventTypes.forEach((eventType) => {
                document.removeEventListener(eventType, handleClickOutside)
            })
        }
    }, [enabled, eventTypes, handleClickOutside])
}
