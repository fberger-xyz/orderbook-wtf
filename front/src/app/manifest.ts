import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        lang: 'en',
        start_url: '/',
    }
}
