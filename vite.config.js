import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Custom plugin to handle file watcher errors
const handleWatcherErrors = () => {
  return {
    name: 'handle-watcher-errors',
    configureServer(server) {
      // Suppress file watcher errors
      process.on('uncaughtException', (error) => {
        if (error.code === 'EINVAL' && error.path && error.path.includes('DumpStack.log.tmp')) {
          console.warn('Ignoring file watcher error for system file:', error.path)
          return
        }
        throw error
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), handleWatcherErrors()],
  root: __dirname,
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/DumpStack.log.tmp',
        '**/*.tmp',
        (filePath) => {
          // Ignore anything at the root of C: drive (outside Users directory)
          const normalized = filePath.replace(/\\/g, '/')
          if (normalized.match(/^C:\/[^/]+$/)) {
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

