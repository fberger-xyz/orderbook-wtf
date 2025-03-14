'use client'

import { IconIds } from '@/enums'
import { Icon } from '@iconify/react'

export default function IconWrapper(props: { icon: IconIds; className?: string }) {
    return <Icon icon={props.icon} className={props.className} />
}
