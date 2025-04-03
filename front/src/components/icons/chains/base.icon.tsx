import React, { SVGProps } from 'react'

export default function BaseSVG(props: SVGProps<SVGSVGElement>) {
    return (
        <svg className={props.className} xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none">
            <g clipPath="url(#a)">
                <path fill="#0052FF" d="M0 32C0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32C14.327 64 0 49.673 0 32Z" />
                <path
                    fill="#fff"
                    d="M31.95 52C43.024 52 52 43.046 52 32s-8.977-20-20.05-20C21.555 12 13.007 19.893 12 30h26.99v4H12c1.006 10.107 9.554 18 19.95 18Z"
                />
            </g>
            <defs>
                <clipPath id="a">
                    <path fill="#fff" d="M0 0h64v64H0z" />
                </clipPath>
            </defs>
        </svg>
    )
}
