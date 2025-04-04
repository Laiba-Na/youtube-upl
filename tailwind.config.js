/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        textBlack: "#073A4B",
        highlightBlue: "#4BC5D4",
        primaryPurple: "#7335A4",
        primaryRed: "#EA3E4E",
        highlightOrange: "#F77227",
        highlightYellow: "#FACF0E",
      },
    },
  },
  plugins: [],
};
