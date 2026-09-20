/**
 * Cloudflare Workers SPA mode (wrangler.toml not_found_handling) must not
 * ship a dist/_redirects file — /* -> /index.html 200 conflicts and fails deploy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const redirectsPath = path.join(__dirname, '..', 'dist', '_redirects');

if (fs.existsSync(redirectsPath)) {
  fs.unlinkSync(redirectsPath);
  console.log('Removed dist/_redirects (SPA routing is configured in wrangler.toml).');
}
