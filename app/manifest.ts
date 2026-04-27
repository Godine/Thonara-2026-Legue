import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Thonara League',
    short_name: 'Thonara',
    description: 'Pool league tracker — Adib, Ahmed & Amine',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#060d08',
    theme_color: '#060d08',
    categories: ['sports', 'games'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
