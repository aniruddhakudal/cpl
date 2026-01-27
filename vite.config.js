import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Custom plugin to handle file watcher errors
const handleWatcherErrors = () => {
  return {
    name: 'handle-watcher-errors',
    configureServer(server) {
      // Additional error handling in server context
      server.ws.on('error', (error) => {
        if (error.code === 'EINVAL' && error.path && error.path.includes('DumpStack.log.tmp')) {
          console.warn('Ignoring file watcher error for system file:', error.path)
          return
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    // react({
    //  jsxRuntime: 'automatic',
    //  fastRefresh: false  // Disable Fast Refresh to prevent RefreshRuntime conflicts
    //}), 
    handleWatcherErrors()
  ],
  root: __dirname,
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/DumpStack.log.tmp',
        '**/*.tmp',
        'C:/DumpStack.log.tmp',
        'C:\\DumpStack.log.tmp',
        'vite.config.js', // Ignore vite.config.js changes to prevent reload issues
        (filePath) => {
          // Ignore anything at the root of C: drive (outside Users directory)
          const normalized = filePath.replace(/\\/g, '/')
          // Match C:/filename (root level files)
          if (normalized.match(/^C:\/[^/]+$/)) {
            return true
          }
          // Match C:\filename (Windows path format)
          if (filePath.match(/^C:\\(DumpStack|hiberfil|pagefile|swapfile)/)) {
            return true
          }
          // Ignore system temp files
          if (normalized.includes('DumpStack.log.tmp') || normalized.endsWith('.tmp')) {
            return true
          }
          return false
        }
      ]
    },
    fs: {
      strict: true,
      allow: [__dirname]
    }
  }
})

