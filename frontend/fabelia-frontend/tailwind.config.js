/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primära färger
        lavenderPurple: '#9B59B6', // För rubriker, knappar och dekorationer
        turquoise: '#e249b4', // För sekundära knappar och länkar
        blue: '#498fe2',
        // Sekundära färger
        softYellow: '#F1C40F', // För accenter och hover-effekter
        lightCoralPink: '#FF6F61', // För bakgrundsdetaljer och små element

        // Neutrala färger
        warmWhite: '#fffcf5', // För primära bakgrunder
        warmWhit: '#151617', // För primära bakgrunder
        softGray: '#BDC3C7', // För text och subtila bakgrunder
        charcoalGray: '#2C3E50', // För kontrasterande text och brödtext

        // Bakgrund och teman
        lightLavender: '#EDE7F6', // För sekundär bakgrund
        veryLightTurquoise: '#E6F9F4', // Alternativ bakgrundsfärg
      },
      backgroundImage: {
        // Bakgrundsbilder
        'epic-bg': "url('/images/epicbg.webp')", // Bakgrundsbild för komponenter
      },
    },
  },
  plugins: [],
};
