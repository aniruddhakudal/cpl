export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Don't rewrite if it's a static asset, root, or already index.html
  if (
    pathname === '/index.html' ||
    pathname === '/' ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/_') ||
    pathname.match(/\.(js|css|json|png|jpg|jpeg|svg|ico|woff|woff2|ttf|eot|webp|gif|mp4|webm|map)$/i)
  ) {
    return context.next();
  }
  
  // For SPA routes, rewrite to index.html
  // Create a new request to /index.html
  const indexUrl = new URL('/index.html', url.origin);
  const indexRequest = new Request(indexUrl, request);
  
  // Fetch the index.html from the assets
  return context.env.ASSETS.fetch(indexRequest);
}

