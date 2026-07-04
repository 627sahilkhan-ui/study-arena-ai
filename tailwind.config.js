/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#090909',
        surface: '#141414',
        card: '#1B1B1B',
        primary: '#FF2E2E',
        success: '#39FF14',
        warning: '#FF9800',
        info: '#00C2FF',
        muted: '#A0A0A0',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        hard: '6px 6px 0 0 #FF2E2E',
        'hard-sm': '4px 4px 0 0 #FF2E2E',
        'hard-white': '6px 6px 0 0 #FFFFFF',
        'hard-dark': '8px 8px 0 0 #000000',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: { marquee: 'marquee 30s linear infinite' },
    },
  },
  plugins: [],
}
