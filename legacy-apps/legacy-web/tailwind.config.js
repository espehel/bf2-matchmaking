/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        fr_50_50: '1fr, 50px, 50px',
      },
    },
  },
  plugins: [],
};
