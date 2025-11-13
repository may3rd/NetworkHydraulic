import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@stores': '/src/stores',
      '@types': '/src/types',
      '@api': '/src/api',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@layouts': '/src/layouts',
      '@pages': '/src/pages',
    },
  },
})
