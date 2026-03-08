import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        cosmic: {
          purple: '#5B21B6',
          'purple-light': '#7C3AED',
          pink: '#BE185D',
          'pink-light': '#DB2777',
          gold: '#D97706',
          'gold-light': '#F59E0B',
          green: '#059669',
          'green-light': '#10B981',
          orange: '#EA580C',
          'orange-light': '#F97316',
          red: '#DC2626',
          'red-light': '#EF4444',
        },
        space: {
          'bg-base': '#F8F9FA',
          surface: '#FFFFFF',
          'surface-light': '#F1F3F5',
          border: '#DEE2E6',
          'text-primary': '#212529',
          'text-secondary': '#495057',
          'text-muted': '#6C757D',
        },
      },
      backgroundImage: {
        'cosmic-gradient': 'none',
        'purple-glow': 'none',
        'pink-nebula': 'none',
        'stardust-shimmer': 'none',
      },
      boxShadow: {
        'glow-purple': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'glow-pink': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { 'background-position': '-1000px 0' },
          '100%': { 'background-position': '1000px 0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 2s infinite',
        'twinkle': 'twinkle 3s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
