'use client'

import { motion } from 'framer-motion'

// https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates#templates
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeInOut', duration: 0.25 }} className="grow">
            {children}
        </motion.div>
    )
}
