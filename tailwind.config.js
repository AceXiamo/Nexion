/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // OKX 主色调 - 亮绿色系
        primary: {
          50: '#f7ffe5',
          100: '#ecffcc',
          200: '#d9ff99',
          300: '#bcff47',  // OKX 主色
          400: '#bcff2f',
          500: '#a3e635',
          600: '#84cc16',
          700: '#65a30d',
          800: '#4d7c0f',
          900: '#365314',
        },
        // 深色主题色彩
        dark: {
          bg: '#000000',        // 纯黑背景
          card: '#0f0f0f',      // 卡片背景
          surface: '#1a1a1a',   // 表面色
          hover: '#272727',     // 悬停状态
          border: '#333333',    // 边框色
          muted: '#888888',     // 静音文字
          secondary: '#cccccc', // 次要文字
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI', 
          'Roboto', 
          'PingFang SC', 
          'Microsoft YaHei', 
          'Helvetica Neue', 
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgb(188 255 47 / 0.2)' },
          '100%': { boxShadow: '0 0 20px rgb(188 255 47 / 0.4)' },
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}