// ✅ tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [ require('nativewind/preset') ],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    "app/_layout.tsx",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
