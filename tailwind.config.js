/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/frontend/**/*.{html,ts,js}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'alpaca-green': '#2ecc71',
        'alpaca-red': '#e74c3c',
        'alpaca-blue': '#3498db',
      },
    },
  },
  plugins: [],
};
