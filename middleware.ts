// Updated middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.includes(path);

  // Generate a random session refresh parameter to avoid caching
  const sessionRefreshParam = Date.now().toString();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // For authenticated paths, add a session_refresh parameter to force fresh data
  if (token && !isPublicPath) {
    const url = new URL(request.url);
    url.searchParams.set('_session_refresh', sessionRefreshParam);
    
    // Only modify the URL if it's different to avoid infinite redirects
    const originalPath = `${url.pathname}${url.search}`;
    const newPath = `${url.pathname}?_session_refresh=${sessionRefreshParam}${url.search ? '&' + url.search.substring(1) : ''}`;
    
    if (!originalPath.includes('_session_refresh')) {
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/connect-google', '/upload', '/login', '/register'],
};