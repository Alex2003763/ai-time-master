/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          'bg': 'var(--color-bg)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          'card-bg': 'var(--color-card-bg)',
          'card-border': 'var(--color-card-border)',
          'brand-primary': 'var(--color-brand-primary)',
          'brand-primary-hover': 'var(--color-brand-primary-hover)',
          'brand-secondary': 'var(--color-brand-secondary)',
          'brand-secondary-hover': 'var(--color-brand-secondary-hover)',
          'brand-tertiary': 'var(--color-brand-tertiary)',
          'brand-tertiary-hover': 'var(--color-brand-tertiary-hover)',
          'nav-active-bg': 'var(--color-nav-active-bg)',
          'nav-hover-bg': 'var(--color-nav-hover-bg)',
          'input-bg': 'var(--color-input-bg)',
          'input-border': 'var(--color-input-border)',
          'input-focus': 'var(--color-input-focus)',
          'progress-track': 'var(--color-progress-track)',
          'btn-primary-bg': 'var(--color-btn-primary-bg)',
          'btn-primary-text': 'var(--color-btn-primary-text)',
          'btn-primary-hover-bg': 'var(--color-btn-primary-hover-bg)',
          'btn-secondary-bg': 'var(--color-btn-secondary-bg)',
          'btn-secondary-text': 'var(--color-btn-secondary-text)',
          'btn-secondary-hover-bg': 'var(--color-btn-secondary-hover-bg)',
          'btn-tertiary-bg': 'var(--color-btn-tertiary-bg)',
          'btn-tertiary-text': 'var(--color-btn-tertiary-text)',
          'btn-tertiary-hover-bg': 'var(--color-btn-tertiary-hover-bg)',
          'btn-default-bg': 'var(--color-btn-default-bg)',
          'btn-default-text': 'var(--color-btn-default-text)',
          'btn-default-hover-bg': 'var(--color-btn-default-hover-bg)',
          'btn-danger-bg': 'var(--color-btn-danger-bg)',
          'btn-danger-text': 'var(--color-btn-danger-text)',
          'btn-danger-hover-bg': 'var(--color-btn-danger-hover-bg)',
          'btn-border': 'var(--color-btn-border)',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in-up': 'slide-in-up 0.5s ease-out forwards',
        'pop-in': 'pop-in 0.3s ease-out forwards',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
