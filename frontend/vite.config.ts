import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React (cached long-term, rarely changes)
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Auth (medium-size, loaded early)
          supabase: ['@supabase/supabase-js'],
          // Markdown rendering (large, only used in StudyHub)
          markdown: ['react-markdown', 'remark-gfm'],
          // Icons (tree-shakeable but still significant)
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
