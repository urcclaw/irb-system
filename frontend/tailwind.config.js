/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,jsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js" // <-- เพิ่มบรรทัดนี้
  ],
  theme: { 
    extend: {} 
  },
  plugins: []
}