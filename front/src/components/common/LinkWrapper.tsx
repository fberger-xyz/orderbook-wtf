import Link from 'next/link'

export default function LinkWrapper({
    children,
    href,
    disabled,
    passHref,
    ...props
}: {
    href: string
    disabled?: boolean
    children?: React.ReactNode
    passHref?: boolean
    className?: string
    rel?: string
    target?: string
}) {
    if (disabled)
        return (
            <button disabled={disabled} {...props}>
                {children}
            </button>
        )

    return (
        <Link href={href} passHref={passHref} {...props}>
            {children}
        </Link>
    )
}
