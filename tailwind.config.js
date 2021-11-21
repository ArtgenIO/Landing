module.exports = {
  mode: 'jit',
  purge: ['./src/index.html'],
  darkMode: true, // or 'media' or 'class'
  theme: {},
  variants: {},
  plugins: [
    require('tailwindcss-textshadow'),
    require('tailwindcss-scrollbar'),
  ],
};
