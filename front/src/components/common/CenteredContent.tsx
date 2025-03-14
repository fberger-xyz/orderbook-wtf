import { cn } from '@/utils'

export default function CenteredContent({ children, ...props }: { children: React.ReactNode; className?: string }) {
    return (
        <div {...props} className={cn('mx-auto flex min-h-[calc(100vh-120px)] w-full flex-col items-center gap-4 sm:gap-5', props.className)}>
            {children}
        </div>
    )
}
