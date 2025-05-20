import { cn } from '@/utils'

export default function PageWrapper({ children, className, ...props }: { children: React.ReactNode; className?: string; showQuote?: boolean }) {
    const commonClassName = 'mx-auto flex min-h-screen w-full max-w-screen flex-col items-start gap-10 px-4 overflow-x-hidden overflow-y-scroll pb-4'
    return (
        <div {...props} className={cn(commonClassName, className)}>
            {children}
        </div>
    )
}
