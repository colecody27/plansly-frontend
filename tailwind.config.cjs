module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      boxShadow: {
        lift: '0 20px 40px -30px rgba(23, 60, 45, 0.55)',
        glow: '0 10px 24px -16px rgba(23, 230, 142, 0.45)'
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
          primary: '#059669',
          'primary-content': '#FFFFFF',
          secondary: '#9BE7FF',
          accent: '#FFD48A',
          neutral: '#1F2937',
          'base-100': '#FBFAF7',
          'base-200': '#F4F1EC',
          'base-300': '#EAE3DB',
          'base-content': '#1F2937',
          info: '#4D9DE0',
          success: '#059669',
          warning: '#FFB020',
          error: '#E35B5B'
        }
      },
      {
        'plannit-dark': {
          primary: '#0DF2A6',
          'primary-content': '#031D14',
          secondary: '#9AE6FF',
          accent: '#FFD48A',
          neutral: '#040907',
          'base-100': '#121816',
          'base-200': '#0B100E',
          'base-300': '#040907',
          'base-content': '#E2E8F0',
          info: '#4D9DE0',
          success: '#0DF2A6',
          warning: '#FFB020',
          error: '#E35B5B'
        }
      }
    ]
  },
  plugins: [require('daisyui')]
};
