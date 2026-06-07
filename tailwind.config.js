/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A1A',
        accent: '#C9A84C',
        'accent-light': '#F5E9CC',
        surface: '#1E1E1E',
        'surface-2': '#2A2A2A',
        border: '#2E2E2E',
        muted: '#A0A0A0',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
    },
  },
  plugins: [],
}
