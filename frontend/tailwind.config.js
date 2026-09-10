/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        miro: {
          canvas: '#ffffff',
          surface: '#f7f8fa',
          'surface-soft': '#fafbfc',
          'surface-yellow': '#fff8e0',
          'surface-blue': '#f5f3ff',
          'border-subtle': '#eef0f3',
          'border-default': '#e0e2e8',
          'border-strong': '#c7cad5',
          'ink': '#1c1c1e',
          'ink-secondary': '#2c2c34',
          'ink-body': '#555a6a',
          'ink-muted': '#8e91a0',
          'yellow': '#ffd02f',
          'yellow-light': '#fff8e0',
          'yellow-dark': '#746019',
          'blue': '#4262ff',
          'blue-light': '#f5f3ff',
          'blue-dark': '#2a41b6',
          'teal': '#0fbcb0',
          'mint': '#c3faf5',
          'teal-dark': '#187574',
          'coral': '#ff9999',
          'coral-light': '#ffc6c6',
          'coral-dark': '#600000',
          'rose': '#ffd8f4',
          'green': '#00b473',
          'green-light': '#e6f7f0',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'lift': '0 8px 24px rgba(0, 0, 0, 0.06)',
        'focus-yellow': '0 0 0 3px rgba(255, 208, 47, 0.35)',
        'focus-blue': '0 0 0 3px rgba(66, 98, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
