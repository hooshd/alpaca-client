/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/frontend/**/*.{html,ts,js}"
  ],
  theme: {
    extend: {
      colors: {
        'alpaca-green': '#2ecc71',
        'alpaca-red': '#e74c3c'
      }
    }
  },
  plugins: []
}
