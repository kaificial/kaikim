import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // notes reads posters from disk to work out spine colours on revalidation
    outputFileTracingIncludes: {
        '/notes': ['./public/music/**/*.jpg'],
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.scdn.co',
                pathname: '/image/**',
            },
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                pathname: '/t/**',
            },
            {
                protocol: 'https',
                hostname: 'a.ltrbxd.com',
                pathname: '/resized/**',
            },
            {
                protocol: 'https',
                hostname: '**.mzstatic.com',
                pathname: '/image/**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/assets/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/music/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/writing',
                destination: '/notes',
            },
        ];
    },
};

export default nextConfig;
