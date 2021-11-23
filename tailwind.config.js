module.exports = {
  mode: 'jit',
  purge: {
    content: ['./src/index.html'],
    safelist: ['simple-lightbox'],
    safelistPatterns: [/^sl-/],
  },
  darkMode: true, // or 'media' or 'class'
  theme: {},
  variants: {},
  plugins: [
    require('tailwindcss-textshadow'),
    require('tailwindcss-scrollbar'),
  ],
};
