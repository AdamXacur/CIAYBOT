/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
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
        sans: ["var(--font-source-sans)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#624E32",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#F0EBE3", 
          foreground: "#624E32",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#F5F5F4",
          foreground: "#71706C",
        },
        accent: {
          DEFAULT: "#F0EBE3",
          foreground: "#624E32",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#624E32",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#624E32",
        },
        // --- PALETA OFICIAL CIAY ---
        'ciay-cream': '#F0EBE3',  // Fondo Principal (Hueso/Crema)
        'ciay-brown': '#624E32',  // Color Primario (Café)
        'ciay-gold': '#C49B64',   // Acentos (Dorado)
        'ciay-silver': '#BDC1C2', // Secundario
        'ciay-slate': '#71706C',  // Texto Secundario
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}