export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
        xs: '0 1px 2px rgba(15, 23, 42, 0.05)'
      },
      borderWidth: {
        3: '3px'
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms'
      },
      backdropBlur: {
        xs: '2px'
      },
      colors: {
        slate: {
          150: '#e9eef5',
          250: '#d8e0ea',
          350: '#aab8c9',
          450: '#718096',
          455: '#718096',
          505: '#64748b',
          550: '#536276',
          650: '#405166',
          705: '#334155',
          750: '#243244',
          850: '#172033'
        },
        cyan: {
          350: '#67e8f9',
          450: '#22d3ee',
          505: '#06b6d4'
        },
        blue: {
          250: '#bfdbfe',
          450: '#60a5fa'
        },
        emerald: {
          350: '#6ee7b7',
          450: '#34d399',
          750: '#047857'
        },
        rose: {
          250: '#fecdd3',
          450: '#fb7185'
        },
        amber: {
          250: '#fde68a',
          450: '#fbbf24'
        },
        indigo: {
          450: '#818cf8'
        },
        fuchsia: {
          450: '#e879f9'
        },
        sky: {
          650: '#0284c7'
        }
      }
    }
  },
  plugins: []
};
