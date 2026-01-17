import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', '"Courier New"', 'Courier', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#F3F0E9',
        ink: '#1a1a1a',
        faded: '#6b6b6b',
        accent: '#2d2d2d',
        border: '#1a1a1a',
      },
      boxShadow: {
        'card': '4px 4px 0px 0px rgba(26, 26, 26, 1)',
        'card-hover': '6px 6px 0px 0px rgba(26, 26, 26, 1)',
      },
      animation: {
        'typewriter': 'typewriter 0.5s steps(40) forwards',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        typewriter: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
