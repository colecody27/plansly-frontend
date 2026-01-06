module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif']
      },
      boxShadow: {
        lift: '0 20px 40px -30px rgba(23, 60, 45, 0.55)',
        glow: '0 12px 30px -18px rgba(23, 230, 142, 0.7)'
      },
      backgroundImage: {
        'soft-radial': 'radial-gradient(circle at top, rgba(23, 230, 142, 0.18), rgba(246, 251, 248, 0) 45%)'
      }
    }
  },
  daisyui: {
    themes: [
      {
        plannit: {
          primary: '#17E68E',
          'primary-content': '#043822',
          secondary: '#9BE7FF',
          accent: '#FFD48A',
          neutral: '#1B2A26',
          'base-100': '#F6FBF8',
          'base-200': '#ECF5F0',
          'base-300': '#D9EAE1',
          'base-content': '#182620',
          info: '#4D9DE0',
          success: '#23C16B',
          warning: '#FFB020',
          error: '#E35B5B'
        }
      },
      {
        'plannit-dark': {
          primary: '#17E68E',
          'primary-content': '#031F13',
          secondary: '#2BD3B0',
          accent: '#FFD48A',
          neutral: '#0B1411',
          'base-100': '#0B1411',
          'base-200': '#0F1D18',
          'base-300': '#162822',
          'base-content': '#E6F6EF',
          info: '#4D9DE0',
          success: '#23C16B',
          warning: '#FFB020',
          error: '#E35B5B'
        }
      }
    ]
  },
  plugins: [require('daisyui')]
};
