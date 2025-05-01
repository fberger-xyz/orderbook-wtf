import { cn } from '@/utils'
import { motion } from 'framer-motion'

// https://fireship.io/lessons/framer-motion-modal/
export function Backdrop({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            className={cn(
                'fixed inset-0 z-30 flex size-full items-center justify-center overflow-y-auto bg-[#190A3580] px-4 backdrop-blur-lg',
                className,
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {children}
        </motion.div>
    )
}
