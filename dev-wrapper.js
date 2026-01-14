// Wrapper script to handle file watcher errors on Windows
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

// Set environment variable for polling mode
process.env.CHOKIDAR_USEPOLLING = 'true';

// Use spawn directly for more reliable startup
import { spawn } from 'child_process';

const vite = spawn('npx', ['vite'], { 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CHOKIDAR_USEPOLLING: 'true' }
});

vite.on('error', (error) => {
  console.error('Failed to start Vite:', error);
  process.exit(1);
});

vite.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Vite process exited with code ${code}`);
    process.exit(code);
  }
});

