/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zen: {
          dark: '#0A1208',
          surface: '#1A2A18',
          green: '#2D5A27',
          gold: '#C9A227',
          blue: '#4A90D9',
          text: '#E8F0E8',
        }
      }
    },
  },
  plugins: [],
}
