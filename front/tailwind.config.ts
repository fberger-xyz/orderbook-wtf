import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            fontSize: {
                '2xs': [
                    '0.55rem',
                    {
                        // https://tailwindcss.com/docs/font-size
                        lineHeight: '0.7rem',
                    },
                ],
            },
            colors: {
                primary: 'hsl(var(--color-primary) / <alpha-value>)',
                secondary: 'hsl(var(--color-secondary) / <alpha-value>)',
                default: 'hsl(var(--color-default) / <alpha-value>)',
                inactive: 'hsl(var(--color-inactive) / <alpha-value>)',
                background: 'hsl(var(--color-background) / <alpha-value>)',
                'light-hover': 'hsl(var(--color-light-hover) / <alpha-value>)',
                'very-light-hover': 'hsl(var(--color-very-light-hover) / <alpha-value>)',
                'light-border': 'hsl(var(--color-light-border) / <alpha-value>)',
                telegram: '#24A1DE',
            },
            animation: {
                'gradient-morph': 'gradient 15s ease infinite',
                'pulse-slow': 'pulse 8s ease-in-out infinite',
                float: 'float 6s ease-in-out infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
            },
        },
    },
    plugins: [],
}

export default config
