/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c141f", ink2: "#111d2d", ink3: "#0a1017",
        paper: "#f4f1e6",
        fpred: "#e5484d", fpgreen: "#37d68a", fpamber: "#f0a52c", fpblue: "#4cc3ff",
      },
      fontFamily: {
        disp: ["var(--font-disp)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};