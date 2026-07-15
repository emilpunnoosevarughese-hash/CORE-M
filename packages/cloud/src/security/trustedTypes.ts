/**
 * Trusted Types Policy
 * This protects against DOM XSS by requiring all DOM sinks (e.g. innerHTML) to go through
 * a policy validation before assignment.
 */

let trustedTypesPolicy: any = null;

export function initTrustedTypes() {
  if (typeof window !== 'undefined' && (window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
    try {
      trustedTypesPolicy = (window as any).trustedTypes.createPolicy('corem-policy', {
        createHTML: (string: string) => {
          // In a production app, you would pass this through DOMPurify.
          // For now, since we don't use dangerouslySetInnerHTML, we just return the string.
          // Third-party scripts violating this will throw an error.
          return string; 
        },
        createScript: (string: string) => string,
        createScriptURL: (string: string) => string,
      });
      console.info('Trusted Types policy initialized.');
    } catch (e) {
      console.warn('Trusted Types policy could not be initialized.', e);
    }
  }
}

export function getTrustedTypesPolicy() {
  return trustedTypesPolicy;
}
