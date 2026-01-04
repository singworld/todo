import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'datepicker': ['@vuepic/vue-datepicker'],
          'draggable': ['vuedraggable']
        }
      }
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true
  }
})
