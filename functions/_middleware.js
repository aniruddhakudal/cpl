export async function onRequest(context) {
  const url = new URL(context.request.url);
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
  
  // For SPA routes, fetch index.html and return it
  // This ensures React Router can handle the routing
  try {
    const indexUrl = new URL('/index.html', url.origin);
    const indexRequest = new Request(indexUrl.toString(), {
      method: context.request.method,
      headers: context.request.headers,
    });
    
    const response = await context.env.ASSETS.fetch(indexRequest);
    
    if (response.ok) {
      // Return the index.html with the original URL preserved for React Router
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching index.html:', error);
  }
  
  // Fallback to next() if something goes wrong
  return context.next();
}

