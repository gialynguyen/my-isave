import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: ['dark'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Linear-inspired color palette
        background: {
          DEFAULT: 'hsl(220, 13%, 10%)', // Dark background
          subtle: 'hsl(220, 13%, 12%)', // Slightly lighter background
          emphasis: 'hsl(220, 13%, 18%)' // Card/container background
        },
        foreground: {
          DEFAULT: 'hsl(220, 13%, 95%)', // Main text color
          subtle: 'hsl(220, 13%, 65%)', // Secondary text color
          muted: 'hsl(220, 13%, 45%)' // Muted text color
        },
        border: {
          DEFAULT: 'hsl(220, 13%, 20%)', // Border color
          subtle: 'hsl(220, 13%, 16%)' // Subtle border color
        },
        primary: {
          DEFAULT: 'hsl(245, 100%, 60%)', // Linear primary blue
          foreground: 'hsl(0, 0%, 100%)',
          hover: 'hsl(245, 80%, 55%)',
          subtle: 'hsla(245, 100%, 60%, 0.1)'
        },
        secondary: {
          DEFAULT: 'hsl(220, 13%, 23%)',
          foreground: 'hsl(220, 13%, 95%)',
          hover: 'hsl(220, 13%, 26%)'
        },
        accent: {
          DEFAULT: 'hsl(140, 80%, 55%)', // Linear green
          foreground: 'hsl(0, 0%, 100%)'
        },
        destructive: {
          DEFAULT: 'hsl(358, 75%, 59%)', // Linear red
          foreground: 'hsl(0, 0%, 100%)',
          hover: 'hsl(358, 75%, 54%)',
          subtle: 'hsla(358, 75%, 59%, 0.1)'
        },
        success: {
          DEFAULT: 'hsl(140, 80%, 55%)', // Linear green
          foreground: 'hsl(0, 0%, 100%)',
          subtle: 'hsla(140, 80%, 55%, 0.1)'
        },
        warning: {
          DEFAULT: 'hsl(38, 95%, 64%)', // Linear yellow
          foreground: 'hsl(0, 0%, 100%)',
          subtle: 'hsla(38, 95%, 64%, 0.1)'
        },
        info: {
          DEFAULT: 'hsl(220, 90%, 60%)', // Linear blue
          foreground: 'hsl(0, 0%, 100%)',
          subtle: 'hsla(220, 90%, 60%, 0.1)'
        },
        card: {
          DEFAULT: 'hsl(220, 13%, 15%)',
          foreground: 'hsl(220, 13%, 95%)'
        },
        popover: {
          DEFAULT: 'hsl(220, 13%, 16%)',
          foreground: 'hsl(220, 13%, 95%)'
        },
        muted: {
          DEFAULT: 'hsl(220, 13%, 16%)',
          foreground: 'hsl(220, 13%, 55%)'
        },
        input: {
          DEFAULT: 'hsl(220, 13%, 16%)',
          foreground: 'hsl(220, 13%, 95%)',
          placeholder: 'hsl(220, 13%, 45%)'
        }
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: [...fontFamily.sans]
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--bits-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--bits-accordion-content-height)' },
          to: { height: '0' }
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'caret-blink': 'caret-blink 1.25s ease-out infinite'
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
