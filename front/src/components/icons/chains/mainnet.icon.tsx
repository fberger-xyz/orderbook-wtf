import React, { SVGProps } from 'react'

export default function MainnetSVG(props: SVGProps<SVGSVGElement>) {
    return (
        <svg className={props.className} xmlns="http://www.w3.org/2000/svg" fill="none">
            <circle cx="30" cy="30" r="30" fill="#627EEA" />
            <path fill="#C0CBF6" d="m29.996 14-.218.73v21.16l.218.215 9.998-5.807L29.996 14Z" />
            <path fill="#fff" d="M29.998 14 20 30.298l9.998 5.807V14Z" />
            <path fill="#C0CBF6" d="m29.996 37.961-.123.148v7.538l.123.353L40 32.158l-10.004 5.803Z" />
            <path fill="#fff" d="M29.998 46v-8.039L20 32.158 29.998 46Z" />
            <path fill="#8197EE" d="m29.996 36.116 9.998-5.806-9.998-4.465v10.271Z" />
            <path fill="#C0CBF6" d="m20 30.31 9.998 5.806V25.845L20 30.31Z" />
        </svg>
    )
}
