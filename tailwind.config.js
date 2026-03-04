/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1F4E79", light: "#2E75B6", dark: "#162E4A" },
      },
    },
  },
  plugins: [],
};

