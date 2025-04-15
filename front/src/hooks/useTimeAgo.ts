import { useState, useEffect } from 'react'

function useTimeAgo(date: Date | number): string {
    const [timeAgo, setTimeAgo] = useState<string>('')

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            const diffInSeconds = Math.floor((now - new Date(date).getTime()) / 1000)

            let result: string

            if (diffInSeconds === 1) {
                result = `now`
            } else if (diffInSeconds < 60) {
                result = `${diffInSeconds - 1} second${diffInSeconds - 1 !== 1 ? 's' : ''} ago`
            } else if (diffInSeconds < 3600) {
                const diffInMinutes = Math.floor(diffInSeconds / 60)
                result = `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
            } else if (diffInSeconds < 86400) {
                const diffInHours = Math.floor(diffInSeconds / 3600)
                result = `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
            } else if (diffInSeconds < 2592000) {
                const diffInDays = Math.floor(diffInSeconds / 86400)
                result = `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
            } else if (diffInSeconds < 31536000) {
                const diffInMonths = Math.floor(diffInSeconds / 2592000)
                result = `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
            } else {
                const diffInYears = Math.floor(diffInSeconds / 31536000)
                result = `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
            }

            setTimeAgo(result)
        }, 1000)

        // cleanup interval on unmount
        return () => clearInterval(interval)
    }, [date])

    return timeAgo
}

export default useTimeAgo
