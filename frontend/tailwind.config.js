/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brutal: {
          bg: '#f4f4f0',
          white: '#ffffff',
          black: '#121212',
          yellow: '#ffde59',
          cyan: '#5ce1e6',
          pink: '#ff66c4',
          green: '#7ed957',
          purple: '#8c52ff',
          orange: '#ff914d',
        }
      },
      boxShadow: {
        'brutal': '4px 4px 0px #121212',
        'brutal-lg': '6px 6px 0px #121212',
        'brutal-xl': '8px 8px 0px #121212',
        'brutal-sm': '2px 2px 0px #121212',
      }
    },
  },
  plugins: [],
}
