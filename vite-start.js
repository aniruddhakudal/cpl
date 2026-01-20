// Custom Vite startup script with early error handling
// Import Vite CLI and run it
import { createServer } from 'vite';
import config from './vite.config.js';

// Start the server
createServer(config)
  .then(server => {
    server.listen();
  })
  .catch(err => {
    // If it's a file watcher error, log it but try to continue
    if (err.code === 'EINVAL' && err.path && (
      err.path.includes('DumpStack.log.tmp') ||
      err.path.includes('hiberfil.sys') ||
      err.path.includes('pagefile.sys')
    )) {
      console.warn('⚠️  File watcher error during server creation (will retry):', err.path);
      // Retry after a short delay
      setTimeout(() => {
        createServer(config)
          .then(server => server.listen())
          .catch(console.error);
      }, 1000);
    } else {
      console.error('Failed to create Vite server:', err);
      process.exit(1);
    }
  });

