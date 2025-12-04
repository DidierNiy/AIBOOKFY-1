tailwind.config = {
  darkMode: 'class', // <-- This is the crucial fix for dark mode
  theme: {
    extend: {
      colors: {
        'primary': '#4F46E5',
        'secondary': '#7C3AED',
        'light-bg': '#F8F9FA',
        'light-card': '#FFFFFF',
        'light-text': '#212529',
        'dark-bg': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-card': '#272727',
        'dark-text': '#E0E0E0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    }
  }
}

