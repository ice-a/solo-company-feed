/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f5ff",
          100: "#dfe8ff",
          200: "#c4d3ff",
          300: "#9eb5ff",
          400: "#6c88ff",
          500: "#3f5bff",
          600: "#2d3fd6",
          700: "#2433aa",
          800: "#212f89",
          900: "#1e2b72"
        }
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};
