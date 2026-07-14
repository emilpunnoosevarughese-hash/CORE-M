import type { PluginManifest } from '../types/manifest';

export class PluginLoader {
  /**
   * Fetches the manifest.json and plugin entry code from a given URL or local path.
   */
  static async fetchPlugin(baseUrl: string): Promise<{ manifest: PluginManifest, code: string }> {
    try {
      // 1. Fetch Manifest
      const manifestRes = await fetch(`${baseUrl}/manifest.json`);
      if (!manifestRes.ok) throw new Error(`Failed to load manifest from ${baseUrl}`);
      
      const contentType = manifestRes.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Plugin not found at ${baseUrl}. (Server returned HTML instead of JSON)`);
      }
      
      const manifest: PluginManifest = await manifestRes.json();

      // 2. Fetch Code
      const codeRes = await fetch(`${baseUrl}/${manifest.entry}`);
      if (!codeRes.ok) throw new Error(`Failed to load plugin code from ${baseUrl}/${manifest.entry}`);
      const code = await codeRes.text();

      return { manifest, code };
    } catch (e: any) {
      console.error('[PluginLoader] Error loading plugin:', e);
      throw e;
    }
  }
}
