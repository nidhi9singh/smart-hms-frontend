/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:'#f0f4ff', 100:'#dce6ff', 200:'#b9ccff',
          300:'#85a3ff', 400:'#4d73ff', 500:'#1a47ff',
          600:'#0029e0', 700:'#0022b8', 800:'#001c94',
          900:'#001270', 950:'#000b47'
        },
        teal: {
          50:'#effef9', 100:'#c7fff0', 200:'#90ffe0',
          300:'#50f5ca', 400:'#1de0b0', 500:'#00c496',
          600:'#00a07c', 700:'#007d63', 800:'#00634f',
          900:'#005241'
        }
      },
      fontFamily: { sans: ['Inter var','Inter','system-ui','sans-serif'] }
    }
  },
  plugins: []
}
