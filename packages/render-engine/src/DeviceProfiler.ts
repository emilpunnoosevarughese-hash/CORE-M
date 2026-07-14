export type DeviceTier = 'Ultra' | 'High' | 'Medium' | 'Low' | 'Very Low';

export interface DeviceProfile {
  tier: DeviceTier;
  gpuVendor: string;
  gpuName: string;
  cpuCores: number;
  deviceMemoryGiB: number;
  browser: string;
  os: string;
  webGpuSupported: boolean;
  webGl2Supported: boolean;
  hdrSupported: boolean;
  videoDecoders: {
    av1: boolean;
    hevc: boolean;
    vp9: boolean;
    h264: boolean;
  };
  videoEncoders: {
    av1: boolean;
    hevc: boolean;
    vp9: boolean;
    h264: boolean;
  };
  maxTextureSize: number;
}

export class DeviceProfiler {
  private static profile: DeviceProfile | null = null;

  static async getProfile(): Promise<DeviceProfile> {
    if (this.profile) return this.profile;

    const gl = document.createElement('canvas').getContext('webgl2');
    const webGl2Supported = !!gl;
    let gpuVendor = 'Unknown';
    let gpuName = 'Unknown';
    let maxTextureSize = 2048;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        gpuName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }

    const webGpuSupported = 'gpu' in navigator;
    const cpuCores = navigator.hardwareConcurrency || 4;
    const deviceMemoryGiB = (navigator as any).deviceMemory || 4;
    
    // HDR check
    const hdrSupported = window.matchMedia('(dynamic-range: high)').matches;

    // Browser and OS
    const userAgent = navigator.userAgent;
    const browser = this.detectBrowser(userAgent);
    const os = this.detectOS(userAgent);

    // Hardware decoding/encoding capabilities (stubs for actual MediaCapabilities API checks)
    const decoders = await this.checkMediaCapabilities('decode');
    const encoders = await this.checkMediaCapabilities('encode');

    let tier: DeviceTier = 'Medium';
    if (cpuCores >= 16 && deviceMemoryGiB >= 16 && webGpuSupported) tier = 'Ultra';
    else if (cpuCores >= 8 && deviceMemoryGiB >= 8) tier = 'High';
    else if (cpuCores >= 4 && deviceMemoryGiB >= 4) tier = 'Medium';
    else if (cpuCores >= 2) tier = 'Low';
    else tier = 'Very Low';

    this.profile = {
      tier,
      gpuVendor,
      gpuName,
      cpuCores,
      deviceMemoryGiB,
      browser,
      os,
      webGpuSupported,
      webGl2Supported,
      hdrSupported,
      videoDecoders: decoders,
      videoEncoders: encoders,
      maxTextureSize
    };

    return this.profile;
  }

  private static detectBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private static detectOS(ua: string): string {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('like Mac OS X')) return 'iOS';
    return 'Unknown';
  }

  private static async checkMediaCapabilities(type: 'decode' | 'encode') {
    // Note: A robust implementation would use navigator.mediaCapabilities.decodingInfo
    return {
      av1: true, // Optimistically assuming true or falling back to software
      hevc: true,
      vp9: true,
      h264: true
    };
  }
}
