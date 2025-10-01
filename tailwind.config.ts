import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
        sans: ['Karla', 'sans-serif'],
      },
      colors: {
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
        // New ocean-inspired color palette
        glacier: {
          DEFAULT: '#72a3bf',
          light: '#8cb5cd',
          dark: '#5d92b0',
        },
        harbor: {
          DEFAULT: '#1d4052',
          light: '#2a5468',
          dark: '#16333f',
        },
        marine: {
          DEFAULT: '#446e87',
          light: '#5a8199',
          dark: '#365870',
        },
        depth: {
          DEFAULT: '#030f18',
          light: '#0a1a26',
          dark: '#010508',
        },
        frost: {
          DEFAULT: '#e0e8e6',
          light: '#f0f5f4',
          dark: '#d0d8d6',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(204, 255, 0, 0.5), 0 0 40px rgba(204, 255, 0, 0.3)"
          },
          "50%": {
            boxShadow: "0 0 30px rgba(204, 255, 0, 0.7), 0 0 60px rgba(204, 255, 0, 0.5)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow": "glow 2s ease-in-out infinite",
      },
      boxShadow: {
        'neon': '0 0 20px rgba(204, 255, 0, 0.5), 0 0 40px rgba(204, 255, 0, 0.3)',
        'neon-lg': '0 0 30px rgba(204, 255, 0, 0.7), 0 0 60px rgba(204, 255, 0, 0.5)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config