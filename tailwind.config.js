/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // The full desktop header — wordmark, six primary links, language,
        // theme, join, login and register — needs about 1330px. Tailwind's xl
        // (1280) is 50px short, which is exactly how the register button came
        // to be clipped at common laptop widths. Below this it collapses to
        // the menu sheet.
        nav: '1360px',
      },
    },
  },
  plugins: [],
}
