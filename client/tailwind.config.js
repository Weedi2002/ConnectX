/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glass: {
          50: 'rgba(255,255,255,0.04)',
          100: 'rgba(255,255,255,0.08)',
          200: 'rgba(255,255,255,0.12)',
          300: 'rgba(255,255,255,0.18)',
          400: 'rgba(255,255,255,0.25)',
        },
        ocean: {
          900: '#0c1c26',
          800: '#102a38',
          700: '#163848',
          600: '#1c4858',
          500: '#225868',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-sm': '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        glow: '0 0 20px rgba(60,160,200,0.15)',
      },
    },
  },
  plugins: [],
};
