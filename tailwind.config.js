/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",  // Updated to match your file extensions
  ],
  theme: {
    extend: {
      colors: {
        degen: '#4C2896',
        'degen-light': '#9b74f5',
      },
      backgroundImage: {
        'degen-gradient': 'linear-gradient(135deg, rgba(155, 116, 245, 0.15) 0%, rgba(155, 116, 245, 0.05) 100%)',
      }
    },
  },
  plugins: [],
}