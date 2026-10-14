import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const base = 'https://kaikim.ca'
    return [
        { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
        { url: `${base}/projects`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
        { url: `${base}/writing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ]
}
