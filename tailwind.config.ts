import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "var(--bg-base)",
        dark: "var(--bg-elevated)",
        card: "var(--bg-card)",
        card2: "var(--bg-card-hover)",
        border: "var(--border)",
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          dark: "var(--gold-dark)",
        },
        gray: "var(--text-muted)",
        soft: "var(--text-soft)",
        wa: "#25D366",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', "sans-serif"],
        script: ['"Dancing Script"', "cursive"],
        outfit: ['"Outfit"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
