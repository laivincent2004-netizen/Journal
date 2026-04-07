/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        journal: {
          dark: '#1C1C1E', // Charcoal Black
          navy: '#000080', // Navy Blue
          crimson: '#DC143C', // Crimson
          highlight: '#FFCC00', // Muted Highlighter Yellow
        }
      }
    },
  },
  plugins: [],
}
