/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1c',
        surface: '#151c2f',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#10b981',
      }
    },
  },
  plugins: [],
}
