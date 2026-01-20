export function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Don't rewrite if it's a static asset or already index.html
  if (
    url.pathname === '/index.html' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|json|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot)$/i)
  ) {
    return context.next();
  }
  
  // Rewrite all other paths to index.html for SPA routing
  return context.rewrite(new URL('/index.html', url.origin));
}

