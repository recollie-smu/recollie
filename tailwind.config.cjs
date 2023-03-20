/* eslint-env node */
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundColor: {
        background: "#F8F9FB",
        primary: "#D7FAFF",
        "primary-30": "#004F57",
        "primary-50": "#008490",
        "primary-99": "#F6FEFF",
      },
      colors: {
        background: "#F8F9FB",
        primary: {
          DEFAULT: "#D7FAFF",
          30: "#004F57",
          50: "#008490",
          99: "#F6FEFF",
        },
        neutral: {
          DEFAULT: "#000000",
          10: "#3C3C3C",
        },
      },
    },
  },
  plugins: [],
};
