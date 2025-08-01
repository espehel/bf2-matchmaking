/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'input-xs',
    'input-sm',
    'input-md',
    'input-lg',
    'btn-xs',
    'btn-sm',
    'btn-md',
    'btn-lg',
    'select-xs',
    'select-sm',
    'select-md',
    'select-lg',
    'btn-primary',
    'btn-secondary',
    'btn-accent',
    'btn-error',
    'btn-warning',
    'btn-info',
    'btn-success',
    'btn-ghost',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        fr_50_50: '1fr, 50px, 50px',
      },
    },
  },
};
