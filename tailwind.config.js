/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50:  '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0d9',
          300: '#f4a9b9',
          400: '#ec7591',
          500: '#e04a6e',
          600: '#cc2a52',
          700: '#ac1d43',
          800: '#8f1a3c',
          900: '#722F37',
          950: '#4A1520',
        },
        cream: {
          50:  '#FFFEF9',
          100: '#FAF7F2',
          200: '#F5F0E8',
          300: '#EDE4D5',
          400: '#DDD0BC',
          500: '#C9B99A',
        },
        gold: {
          400: '#D4AF6A',
          500: '#C9A96E',
          600: '#B8934A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-luxury': 'linear-gradient(135deg, #722F37 0%, #4A1520 100%)',
        'gradient-cream': 'linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 100%)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 169, 110, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(201, 169, 110, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'luxury': '0 20px 60px -10px rgba(114, 47, 55, 0.3)',
        'card': '0 4px 24px rgba(114, 47, 55, 0.12)',
        'gold': '0 4px 24px rgba(201, 169, 110, 0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.pt-safe-top': {
          paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)',
        },
        '.pb-safe-bottom': {
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
        },
      })
    },
  ],
}
