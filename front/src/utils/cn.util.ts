// see https://www.youtube.com/watch?v=re2JFITR7TI

import { clsx, ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
