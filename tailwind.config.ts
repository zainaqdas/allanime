import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#050805',
          secondary: '#0a120a',
          card: '#0f1a0f',
          'card-hover': '#162216',
          input: '#0f1a0f',
        },
        text: {
          primary: '#f0fdf0',
          secondary: '#a0b8a0',
          muted: '#6b806b',
        },
        accent: {
          1: '#10b981',
          2: '#34d399',
          glow: 'rgba(16, 185, 129, 0.3)',
        },
        border: '#1a2a1a',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
