'use client'

import { cn } from '@/utils'

export default function JsonField({ children, className }: { children?: React.ReactNode; className?: string }) {
    return <pre className={cn('max-h-96 overflow-y-auto rounded-md p-2 text-xs text-center text-wrap', className)}>{children}</pre>
}
