import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', '..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@corem/animation': path.resolve(root, 'packages/animation/src'),
      '@corem/assets':    path.resolve(root, 'packages/assets/src'),
      '@corem/audio':     path.resolve(root, 'packages/audio/src'),
      '@corem/auth':      path.resolve(root, 'packages/auth/src'),
      '@corem/cloud':     path.resolve(root, 'packages/cloud/src'),
      '@corem/effects':   path.resolve(root, 'packages/effects/src'),
      '@corem/export':    path.resolve(root, 'packages/export/src'),
      '@corem/playback':  path.resolve(root, 'packages/playback/src'),
      '@corem/timeline':  path.resolve(root, 'packages/timeline/src'),
      '@corem/ui':        path.resolve(root, 'packages/ui/src'),
      '@corem/uploader':  path.resolve(root, 'packages/uploader/src'),
      '@corem/plugins':   path.resolve(root, 'packages/plugins/src'),
      '@corem/cv':        path.resolve(root, 'packages/cv/src'),
      '@corem/ai':        path.resolve(root, 'packages/ai/src'),
      '@corem/render-engine': path.resolve(root, 'packages/render-engine/src'),
    }
  },
  server: {},
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('zustand')) {
              return 'vendor-zustand';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('@ffmpeg')) {
              return 'vendor-ffmpeg';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            return 'vendor-core'; // Fallback for other node_modules
          }
          
          // Workspace packages code splitting
          if (id.includes('packages/')) {
            if (id.includes('packages/ai')) return 'module-ai';
            if (id.includes('packages/export')) return 'module-export';
            if (id.includes('packages/effects')) return 'module-effects';
            if (id.includes('packages/plugins')) return 'module-plugins';
            if (id.includes('packages/auth')) return 'module-auth';
            if (id.includes('packages/playback') || id.includes('packages/timeline') || id.includes('packages/audio')) {
              return 'editor-core'; // Group core playback & timeline together
            }
            if (id.includes('packages/uploader') || id.includes('packages/assets')) {
              return 'module-assets';
            }
          }
        }
      }
    }
  }
})
