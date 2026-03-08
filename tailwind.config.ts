// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:     '#04060a',
        void:    '#060a10',
        deep:    '#090e18',
        surface: '#0d1420',
        raised:  '#111b2a',
        panel:   '#152035',
        edge:    '#1c2c42',
        line:    '#243348',
        muted:   '#2e4463',
        text:    '#8ca8c8',
        bright:  '#c8e0f8',
        gold:    '#e8b84b',
        aqua:    '#00d4ff',
        jade:    '#00e89a',
        ruby:    '#ff3366',
        amber:   '#ff8c00',
        violet:  '#a855f7',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Space Mono', 'monospace'],
        ui:   ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
