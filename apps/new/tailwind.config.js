/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        fr_50_50: '1fr, 50px, 50px',
      },
    },
  },
  daisyui: {
    themes: ['bumblebee'],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
};
