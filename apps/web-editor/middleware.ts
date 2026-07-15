import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In a real Vercel Edge implementation for a Vite app, this would be vercel Edge Middleware.
// Since we are not using Next.js natively, Vercel supports middleware via `middleware.ts` or edge functions.
// Note: Some Vercel specific types are used here for demonstration of the requested security features.
// If run strictly locally, Vite dev server ignores this.

const RATE_LIMITS = {
  '/login': { limit: 15, window: 900 },      // 15 req / 15 min
  '/register': { limit: 15, window: 900 },
  '/password-reset': { limit: 5, window: 3600 },
  '/invite': { limit: 20, window: 3600 },
  '/project': { limit: 30, window: 3600 },
  '/comment': { limit: 60, window: 60 },
  '/upload': { limit: 10, window: 3600 },
  '/export': { limit: 20, window: 3600 },
};

// In-memory store for rate limiting (Note: In edge, this resets per isolate, use Redis for global)
const rateLimitCache = new Map<string, { count: number, resetAt: number }>();

function checkRateLimit(ip: string, path: string): boolean {
  let matchedConfig = null;
  for (const [route, config] of Object.entries(RATE_LIMITS)) {
    if (path.includes(route)) {
      matchedConfig = config;
      break;
    }
  }

  if (!matchedConfig) return true; // No limit for this route

  const key = `${ip}:${path}`;
  const now = Math.floor(Date.now() / 1000);
  
  const record = rateLimitCache.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + matchedConfig.window });
    return true;
  }
  
  if (record.count >= matchedConfig.limit) {
    return false; // Rate limited
  }
  
  record.count += 1;
  return true;
}

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;

  // 1. Rate Limiting
  if (!checkRateLimit(ip, path)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const response = NextResponse.next();

  // 2. Dynamic CSP Generation
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https://firebasestorage.googleapis.com https://res.cloudinary.com https://lh3.googleusercontent.com;
    connect-src 'self' https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebasestorage.googleapis.com wss://*.firebaseio.com https://vitals.vercel-insights.com;
    frame-src 'self' https://corem-46d49.firebaseapp.com https://www.google.com/recaptcha/;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
    report-uri /api/security/csp-report;
  `.replace(/\s{2,}/g, ' ').trim();

  // 3. Security Headers
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Advanced Isolation Headers
  response.headers.set('Origin-Agent-Cluster', '?1');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Note: COOP/COEP require credentialless/same-origin-allow-popups for Firebase Auth 
  // response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

  return response;
}

export const config = {
  matcher: '/:path*',
};
