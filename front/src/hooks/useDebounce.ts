import { useEffect, useRef, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [value, delay])

    return debouncedValue
}
