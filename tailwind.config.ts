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
        black: "#0D0D0D",
        dark: "#141414",
        card: "#1A1A1A",
        card2: "#1E1E1E",
        border: "#2A2A2A",
        gold: {
          DEFAULT: "#E8A820",
          light: "#F5C84A",
          dark: "#B8851A",
        },
        gray: "#888888",
        soft: "#CCCCCC",
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
