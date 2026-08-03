/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // John Deere green (#367C2B) — owner-requested identity color
                primary: {
                    50: '#f2f9f0', 100: '#e2f1db', 200: '#c5e3ba', 300: '#9ace89',
                    400: '#6cb156', 500: '#479434', 600: '#367C2B', 700: '#2c6323',
                    800: '#264f20', 900: '#20421c', 950: '#0e240b',
                },
                // Harvest gold — highlights & computed totals
                accent: {
                    50: '#fbf7eb', 100: '#f5ecce', 200: '#ebd79b', 300: '#dfbd63',
                    400: '#d4a53c', 500: '#c48c26', 600: '#a96e1e', 700: '#87521c',
                    800: '#70431e', 900: '#60391e', 950: '#371d0d',
                },
                surface: '#f7f6f3', // warm off-white page background
            },
            fontFamily: {
                sans: [
                    'system-ui', '-apple-system', 'Segoe UI', 'Roboto',
                    'Noto Sans Kannada Web', 'Noto Sans Kannada', 'sans-serif',
                ],
            },
            boxShadow: {
                card: '0 1px 2px rgb(28 25 23 / 0.04), 0 4px 16px -4px rgb(28 25 23 / 0.06)',
            },
        },
    },
    plugins: [],
}
