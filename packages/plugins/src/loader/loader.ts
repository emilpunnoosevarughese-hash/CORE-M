import { PluginManifest } from '../types/manifest';
import { PluginValidator } from './validator';

export class PluginLoader {
  /**
   * Loads a plugin manifest from a remote URL.
   */
  static async loadRemoteManifest(url: string): Promise<PluginManifest> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch manifest: ${response.statusText}`);
      
      const manifestRaw = await response.json();
      
      // Validation will throw an error if the manifest is invalid
      PluginValidator.validateManifest(manifestRaw);
      
      return manifestRaw;
    } catch (err: any) {
      throw new Error(`PluginLoader Error: ${err.message}`);
    }
  }

  /**
   * Loads a plugin manifest from a local string (e.g. from an uploaded file).
   */
  static async loadLocalManifest(manifestJsonStr: string): Promise<PluginManifest> {
    try {
      const manifestRaw = JSON.parse(manifestJsonStr);
      PluginValidator.validateManifest(manifestRaw);
      return manifestRaw;
    } catch (err: any) {
      throw new Error(`PluginLoader Error: ${err.message}`);
    }
  }

  /**
   * Loads the plugin entry code as a string (useful for workers).
   */
  static async loadEntryCode(baseUrl: string, entryPath: string): Promise<string> {
    const entryUrl = new URL(entryPath, baseUrl).toString();
    const response = await fetch(entryUrl);
    if (!response.ok) throw new Error(`Failed to load plugin entry code from ${entryUrl}`);
    return await response.text();
  }
}
