/**
 * Centralized Production Logger
 * Ensures sensitive data is stripped before logging to stdout or monitoring services.
 */

const SENSITIVE_KEYS = ['password', 'token', 'jwt', 'apiKey', 'secret', 'key'];

function sanitize(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    // Mask emails
    if (data.includes('@')) {
      return data.replace(/(?<=^.{2}).*(?=@)/, '***');
    }
    // Mask long strings that might be tokens (very naive token detection)
    if (data.length > 64 && /^[A-Za-z0-9-_=\.]+$/.test(data)) {
      return '[REDACTED_TOKEN]';
    }
    return data;
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitize(item));
    }
    
    const sanitizedObj: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitize(value);
      }
    }
    return sanitizedObj;
  }
  
  return data;
}

export const logger = {
  info: (message: string, meta?: any) => {
    if (!import.meta.env.PROD) console.info(`[INFO] ${message}`, sanitize(meta));
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, sanitize(meta));
  },
  error: (message: string, error?: any, meta?: any) => {
    // In production, send to Sentry/Datadog here, but strip stack traces for UI
    const sanitizedError = error instanceof Error 
      ? { message: error.message, name: error.name } // Omitting stack
      : sanitize(error);
    
    console.error(`[ERROR] ${message}`, sanitizedError, sanitize(meta));
  }
};
