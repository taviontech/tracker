/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-in-right': 'slideInRight 0.4s ease-out both',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-alt': 'floatAlt 7s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'spin-slower': 'spin 18s linear infinite',
        'spin-reverse': 'spinReverse 14s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'ping-slow': 'pingSlow 2.5s ease-out infinite',
        'marquee': 'marquee 28s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatAlt: {
          '0%, 100%': { transform: 'translateY(-5px)' },
          '50%': { transform: 'translateY(5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        spinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(59,130,246,0.4)' },
          '50%': { boxShadow: '0 0 32px rgba(59,130,246,0.7), 0 0 60px rgba(59,130,246,0.2)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        pingSlow: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255,255,255,0.03)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
      },
      colors: {
        dark: {
          950: '#05080f',
          900: '#0a0f1e',
          800: '#0d1428',
          700: '#111a35',
          600: '#1a2540',
        },
      },
    },
  },
  plugins: [],
};
