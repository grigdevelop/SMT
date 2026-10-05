import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]', '[data-theme="black"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'checkmark-pop': {
          '0%': { transform: 'scale(0.85)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'checkmark-pop': 'checkmark-pop 120ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark', 'black'],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
