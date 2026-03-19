/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Space Grotesk'", "-apple-system", "sans-serif"],
      },
      colors: {
        yellow: {
          DEFAULT: '#F4D23A',
          50: 'rgba(244,210,58,0.05)',
          100: 'rgba(244,210,58,0.1)',
          200: 'rgba(244,210,58,0.2)',
          300: 'rgba(244,210,58,0.3)',
          400: 'rgba(244,210,58,0.4)',
          600: 'rgba(244,210,58,0.6)',
          800: 'rgba(244,210,58,0.8)',
        },
        'green-dark': {
          DEFAULT: '#113B2A',
          50: 'rgba(17,59,42,0.05)',
          100: 'rgba(17,59,42,0.1)',
          500: 'rgba(17,59,42,0.5)',
        },
        cream: {
          DEFAULT: '#F7F4EE',
          60: 'rgba(247,244,238,0.6)',
          30: 'rgba(247,244,238,0.3)',
          10: 'rgba(247,244,238,0.1)',
        },
        navy: {
          DEFAULT: '#06243B',
        },
        lime: {
          DEFAULT: '#BDF24A',
          200: 'rgba(189,242,74,0.2)',
          300: 'rgba(189,242,74,0.3)',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "12px",
        "2xl": "16px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
