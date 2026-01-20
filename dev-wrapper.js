// Wrapper script to handle file watcher errors on Windows
// Set up error handlers BEFORE importing anything

// Intercept process.emit to catch errors early
const originalEmit = process.emit.bind(process);
process.emit = function(type, ...args) {
  if (type === 'uncaughtException') {
    const error = args[0];
    if (error && error.code === 'EINVAL' && error.path && (
      error.path.includes('DumpStack.log.tmp') ||
      error.path.includes('hiberfil.sys') ||
      error.path.includes('pagefile.sys') ||
      error.path.match(/^C:\\(DumpStack|hiberfil|pagefile|swapfile)/)
    )) {
      console.warn('⚠️  Ignoring file watcher error for system file:', error.path);
      console.warn('   This is a known Windows issue. The dev server should still work.');
      return true; // Prevent default error handling
    }
  }
  return originalEmit(type, ...args);
};

process.on('uncaughtException', (error) => {
  // Ignore EINVAL errors for Windows system files
  if (error.code === 'EINVAL' && error.path && (
    error.path.includes('DumpStack.log.tmp') ||
    error.path.includes('hiberfil.sys') ||
    error.path.includes('pagefile.sys') ||
    error.path.match(/^C:\\(DumpStack|hiberfil|pagefile|swapfile)/)
  )) {
    console.warn('⚠️  Ignoring file watcher error for system file:', error.path);
    console.warn('   This is a known Windows issue. The dev server should still work.');
    return;
  }
  // Re-throw other errors
  throw error;
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.code === 'EINVAL' && reason.path && (
    reason.path.includes('DumpStack.log.tmp') ||
    reason.path.includes('hiberfil.sys') ||
    reason.path.includes('pagefile.sys')
  )) {
    console.warn('⚠️  Ignoring file watcher error for system file:', reason.path);
    return;
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Set environment variables for polling mode
process.env.CHOKIDAR_USEPOLLING = 'true';

// Import and run Vite directly instead of spawning
import('./vite-start.js');

