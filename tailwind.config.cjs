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
        mint: {
          primary: '#00C2A8',
          'primary-content': '#083B3D',
          secondary: '#92D8FF',
          accent: '#FFD07A',
          neutral: '#1D2E2F',
          'base-100': '#F3FBF9',
          'base-200': '#E6F6F1',
          'base-300': '#CCEDE4',
          'base-content': '#132322',
          info: '#3F8EFC',
          success: '#00B57E',
          warning: '#F9A826',
          error: '#E4572E'
        }
      },
      {
        coastal: {
          primary: '#1BD4C6',
          'primary-content': '#0A3A38',
          secondary: '#FFD6A5',
          accent: '#6EE7FF',
          neutral: '#1A2E35',
          'base-100': '#F5FAFC',
          'base-200': '#E8F3F8',
          'base-300': '#D5E9F2',
          'base-content': '#122026',
          info: '#438DD5',
          success: '#1DBF73',
          warning: '#FFA552',
          error: '#E45A5A'
        }
      }
    ]
  },
  plugins: [require('daisyui')]
};
