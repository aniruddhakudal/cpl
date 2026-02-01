// Custom Vite startup script with early error handling
// Import Vite CLI and run it
import { createServer } from 'vite';
import config from './vite.config.js';

// Prevent duplicate server creation
let serverInstance = null;

async function startServer() {
  if (serverInstance) {
    console.warn('Server already exists, skipping duplicate creation');
    return serverInstance;
  }

  try {
    serverInstance = await createServer(config);
    await serverInstance.listen();
    console.log('Vite dev server started');
    return serverInstance;
  } catch (err) {
    // If it's a file watcher error, log it but try to continue
    if (err.code === 'EINVAL' && err.path && (
      err.path.includes('DumpStack.log.tmp') ||
      err.path.includes('hiberfil.sys') ||
      err.path.includes('pagefile.sys')
    )) {
      console.warn('⚠️  File watcher error during server creation (will retry):', err.path);
      // Retry after a short delay
      setTimeout(() => {
        startServer().catch(console.error);
      }, 1000);
    } else {
      console.error('Failed to create Vite server:', err);
      process.exit(1);
    }
  }
}

startServer();

