/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores de la bandera de Brasil
        'brazil-green': '#009639',
        'brazil-yellow': '#FEDD00',
        'brazil-blue': '#012169',
        'brazil-white': '#FFFFFF',
        'brazil-gray': '#6B7280',
        'brazil-black': '#1F2937',
        // Colores del sistema
        primary: '#009639',      // Verde Brasil
        secondary: '#6B7280',    // Gris
        accent: '#FEDD00',       // Amarillo Brasil
        dark: '#1F2937',         // Negro
        light: '#FFFFFF',        // Blanco
        success: '#009639',      // Verde para éxito
        warning: '#FEDD00',      // Amarillo para advertencias
        danger: '#DC2626',       // Rojo para errores
      },
    },
  },
  plugins: [],
}
