import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      './store': './mock-store'
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  cacheDir: '.vite_cache'
}) 