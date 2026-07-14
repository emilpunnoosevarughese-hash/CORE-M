// SDK Exports
export * from '../types/api';
export * from '../types/manifest';
export * from '../types/lifecycle';

/**
 * Developer helper to define a plugin manifest with strong typing
 */
import { PluginManifest } from '../types/manifest';

export function definePlugin(manifest: PluginManifest): PluginManifest {
  return manifest;
}

// In a real SDK distributed via NPM, we would also expose ambient declarations
// for `self.PluginAPI` so that TypeScript compiler knows how to resolve it
// when compiling the worker code.
