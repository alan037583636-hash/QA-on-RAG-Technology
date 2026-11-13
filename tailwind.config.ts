import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2457D6',
        accent: '#0E9F9A',
        surface: '#F4F7FC',
        ink: '#17243A',
        muted: '#64748B',
        line: '#DCE4F0',
      },
    },
  },
  plugins: [],
} satisfies Config
