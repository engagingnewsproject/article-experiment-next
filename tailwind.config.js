/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333',
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282',
              },
            },
            h1: {
              color: '#111',
              fontWeight: '700',
              marginTop: '2em',
              marginBottom: '1em',
            },
            h2: {
              color: '#111',
              fontWeight: '600',
              marginTop: '1.5em',
              marginBottom: '0.75em',
            },
            h3: {
              color: '#111',
              fontWeight: '600',
              marginTop: '1.25em',
              marginBottom: '0.5em',
            },
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              lineHeight: '1.75',
            },
            blockquote: {
              borderLeftColor: '#3182ce',
              backgroundColor: '#f7fafc',
              padding: '1em',
              borderRadius: '0.5em',
            },
            code: {
              backgroundColor: '#f3f4f6',
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
              fontSize: '0.875em',
            },
            pre: {
              backgroundColor: '#1a202c',
              color: '#e2e8f0',
              padding: '1em',
              borderRadius: '0.5em',
              overflowX: 'auto',
            },
            img: {
              borderRadius: '0.5em',
              marginTop: '1.5em',
              marginBottom: '1.5em',
            },
            ul: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              paddingLeft: '1.5em',
            },
            ol: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              paddingLeft: '1.5em',
            },
            li: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

