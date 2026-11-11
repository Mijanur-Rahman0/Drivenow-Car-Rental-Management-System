/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#41431B',
        'dark-hover': '#5C6020',
        sage: '#AEB784',
        'sage-dark': '#8A9460',
        warm: '#E3DBBB',
        cream: '#F8F3E1',
        ink: '#2A2C0F',
        muted: '#6B7040',
      },
      fontFamily: {
        head: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(65,67,27,.10)',
        lift: '0 12px 48px rgba(65,67,27,.15)',
      },
      borderRadius: { '2xl': '20px' },
    },
  },
  plugins: [],
};
