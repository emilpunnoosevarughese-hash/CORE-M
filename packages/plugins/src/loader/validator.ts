import { PluginManifest } from '../types/manifest';

export class PluginValidator {
  /**
   * Validates a plugin manifest object against the required schema.
   * Throws an error if validation fails.
   */
  static validateManifest(manifest: Partial<PluginManifest>): asserts manifest is PluginManifest {
    if (!manifest) throw new Error('Manifest cannot be empty');
    if (!manifest.id || typeof manifest.id !== 'string') throw new Error('Missing or invalid plugin ID');
    if (!manifest.name || typeof manifest.name !== 'string') throw new Error('Missing or invalid plugin name');
    if (!manifest.version || typeof manifest.version !== 'string') throw new Error('Missing or invalid plugin version');
    if (!manifest.author || typeof manifest.author !== 'string') throw new Error('Missing or invalid plugin author');
    if (!manifest.description || typeof manifest.description !== 'string') throw new Error('Missing or invalid plugin description');
    if (!manifest.category || typeof manifest.category !== 'string') throw new Error('Missing or invalid plugin category');
    if (!manifest.executionModel || !['worker', 'panel', 'native'].includes(manifest.executionModel)) {
      throw new Error(`Invalid execution model: ${manifest.executionModel}`);
    }
    if (!manifest.supportedCoreMVersion || typeof manifest.supportedCoreMVersion !== 'string') throw new Error('Missing supportedCoreMVersion');
    if (!manifest.entry || typeof manifest.entry !== 'string') throw new Error('Missing or invalid entry file path');
    if (!Array.isArray(manifest.permissions)) throw new Error('Permissions must be an array');
    
    // Validate each permission
    const validPermissions = [
      'timeline.read', 'timeline.write', 'playback.read', 'playback.control',
      'asset.read', 'asset.write', 'project.read', 'project.write',
      'filesystem.read', 'filesystem.write', 'network', 'clipboard',
      'notifications', 'ai', 'cloud', 'export', 'settings', 'render', 'plugins'
    ];
    
    for (const perm of manifest.permissions) {
      if (!validPermissions.includes(perm)) {
        throw new Error(`Invalid permission requested: ${perm}`);
      }
    }

    // In a real implementation we would also check semantic versioning compatibility:
    // semver.satisfies(CORE_M_VERSION, manifest.supportedCoreMVersion)
  }

  /**
   * Validates a plugin signature (Stubbed for future use)
   */
  static async validateSignature(manifest: PluginManifest, signature: string): Promise<boolean> {
    // Future: Cryptographically verify the plugin signature using a public key registry.
    return true; 
  }
}
