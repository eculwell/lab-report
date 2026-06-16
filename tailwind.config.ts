import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'byu-navy': '#002e5d',
      },
    },
  },
  plugins: [],
};

export default config;
