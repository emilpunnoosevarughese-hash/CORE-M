import type { DeviceProfile } from './DeviceProfiler';
import { DeviceProfiler } from './DeviceProfiler';

export interface BenchmarkResults {
  gpuScore: number;
  cpuScore: number;
  memoryScore: number;
  browserScore: number;
  diskScore?: number;
  totalScore: number;
  profile: DeviceProfile;
}

export class GpuBenchmark {
  static async runOnFirstLaunch(): Promise<BenchmarkResults> {
    const profile = await DeviceProfiler.getProfile();
    
    // 1. CPU Score
    const cpuScore = profile.cpuCores * 1000;
    
    // 2. Memory Score
    const memoryScore = profile.deviceMemoryGiB * 500;
    
    // 3. GPU Score (Simulated benchmark)
    let gpuScore = 0;
    if (profile.webGpuSupported) gpuScore += 5000;
    if (profile.webGl2Supported) gpuScore += 3000;
    
    // Fast texture size usually correlates with better GPUs
    gpuScore += (profile.maxTextureSize / 2048) * 1000;

    // 4. Browser Score
    let browserScore = profile.browser === 'Chrome' || profile.browser === 'Edge' ? 1000 : 500;

    const totalScore = cpuScore + memoryScore + gpuScore + browserScore;

    return {
      gpuScore,
      cpuScore,
      memoryScore,
      browserScore,
      totalScore,
      profile
    };
  }
}
