/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // GIKI-inspired colors (Dark blues/golds look great for ERPs)
        primary: "#1e3a8a",
        secondary: "#fbbf24",
      },
    },
  },
  plugins: [],
};
