import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pool: {
          bg: '#060d08',
          surface: '#0e1e12',
          felt: '#1a4731',
          'felt-light': '#246340',
          border: '#1f3525',
          gold: '#c9a227',
          'gold-light': '#e8c547',
          chalk: '#f0ede6',
          'chalk-dim': '#7a786f',
          red: '#ef4444',
          'green-bright': '#22c55e',
        },
      },
      fontFamily: {
        heading: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'felt-texture': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Crect width='6' height='6' fill='%231a4731'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23ffffff' opacity='0.025'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23ffffff' opacity='0.025'/%3E%3C/svg%3E")`,
      },
      animation: {
        shimmer:      'shimmer 3s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.28s ease-out',
        'slide-down': 'slideDown 0.22s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,162,39,0)' },
          '50%':       { boxShadow: '0 0 16px 4px rgba(201,162,39,0.25)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
