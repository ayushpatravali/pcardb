/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Deep forest green — the bank's identity color
                primary: {
                    50: '#f2f8f4', 100: '#e0efe5', 200: '#c2dfcc', 300: '#94c6a7',
                    400: '#5fa67c', 500: '#3d8a5e', 600: '#2b6e4a', 700: '#23583d',
                    800: '#1e4732', 900: '#193b2a', 950: '#0c2118',
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
