import { cn } from '@/utils'

export default function PageWrapper({ children, className, ...props }: { children: React.ReactNode; className?: string; showQuote?: boolean }) {
    const commonClassName =
        'mx-auto mt-[20px] flex min-h-screen w-full max-w-screen flex-col items-start gap-10 overflow-auto px-4 pb-4 sm:mt-12 md:px-8'
    return (
        <div {...props} className={cn(commonClassName, className)}>
            {children}
        </div>
    )
}
