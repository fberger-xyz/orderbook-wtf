import React, { SVGProps } from 'react'

export default function BalancerV2SVG(props: SVGProps<SVGSVGElement>) {
    return (
        <svg className={props.className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 129 128">
            <g clipPath="url(#a)">
                <rect width="128" height="128" x=".452" fill="#fff" rx="64" />
                <path
                    fill="#000"
                    fillRule="evenodd"
                    d="M84.608 70.58c17.491 2.587 29.696 8.438 29.696 15.24 0 9.2-22.32 16.659-49.852 16.659-27.533 0-49.852-7.459-49.852-16.658 0-6.803 12.204-12.654 29.696-15.24 6.008 1.221 12.87 1.914 20.156 1.914 7.103 0 13.803-.658 19.702-1.823l.454-.092Zm-7.54-27.39c15.843 1.765 27.265 6.76 27.265 12.647 0 7.36-17.855 13.326-39.881 13.326S24.57 63.197 24.57 55.837c0-5.887 11.422-10.882 27.265-12.646 3.88.635 8.143.985 12.617.985 4.317 0 8.438-.327 12.208-.92l.409-.065Z"
                    clipRule="evenodd"
                />
                <path
                    fill="#000"
                    d="M64.452 41.51c16.519 0 29.91-4.474 29.91-9.994s-13.391-9.994-29.91-9.994c-16.52 0-29.912 4.474-29.912 9.994s13.392 9.995 29.912 9.995Z"
                />
            </g>
            <rect width="127" height="127" x=".952" y=".5" stroke="#E5E7EB" rx="63.5" />
            <defs>
                <clipPath id="a">
                    <rect width="128" height="128" x=".452" fill="#fff" rx="64" />
                </clipPath>
            </defs>
        </svg>
    )
}
