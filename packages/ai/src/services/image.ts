export interface AIImageService {
  removeBackground(imageBlobId: string, onProgress?: (p: number) => void): Promise<string>;
  upscale(imageBlobId: string, scaleFactor: number, onProgress?: (p: number) => void): Promise<string>;
  generativeFill(imageBlobId: string, maskBlobId: string, prompt: string, onProgress?: (p: number) => void): Promise<string>;
}

export class DefaultImageService implements AIImageService {
  async removeBackground(imageBlobId: string, onProgress?: (p: number) => void): Promise<string> {
    throw new Error('Not Implemented Yet: Background Removal is pending WebGL/WebGPU matting integration.');
  }

  async upscale(imageBlobId: string, scaleFactor: number, onProgress?: (p: number) => void): Promise<string> {
    throw new Error('Not Implemented Yet: Upscaling requires external API provider configuration.');
  }

  async generativeFill(imageBlobId: string, maskBlobId: string, prompt: string, onProgress?: (p: number) => void): Promise<string> {
    throw new Error('Not Implemented Yet: Generative Fill requires external API provider configuration.');
  }
}
