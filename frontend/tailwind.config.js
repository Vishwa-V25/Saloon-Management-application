/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0C0C0E',
        charcoal: '#17171A',
        ivory: '#FAF9F6',
        champagne: '#F4EFE6',
        gold: {
          50: '#FBF8F1',
          100: '#F5EDD8',
          200: '#E9D6A8',
          300: '#DCBE78',
          400: '#CFA54E',
          500: '#C59B43',
          600: '#A67E2E',
          700: '#836124',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        luxury: '0 20px 50px -12px rgba(12, 12, 14, 0.12)',
        gold: '0 10px 30px -10px rgba(197, 155, 67, 0.35)',
      },
    },
  },
  plugins: [],
};
