/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        dark: '#0F172A',
        card: '#1E293B',
        success: '#10B981',
        warning: '#F59E0B',
      },
      fontFamily: {
        devanagari: ["'Noto Serif Devanagari'", "'Noto Sans Devanagari'", 'serif'],
      },
    },
  },
  plugins: [],
};
