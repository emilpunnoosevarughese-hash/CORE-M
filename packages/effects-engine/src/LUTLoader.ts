export class LUTLoader {
  
  /**
   * Parses a standard .cube 3D LUT file and returns a Float32Array
   * suitable for uploading as a WebGL 3D Texture.
   */
  public static parseCube(cubeData: string): { size: number, data: Float32Array } {
    const lines = cubeData.split('\n');
    let size = 0;
    const data: number[] = [];

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      if (cleanLine.startsWith('LUT_3D_SIZE')) {
        size = parseInt(cleanLine.split(' ')[1], 10);
      } else {
        const parts = cleanLine.split(' ');
        if (parts.length >= 3) {
          const r = parseFloat(parts[0]);
          const g = parseFloat(parts[1]);
          const b = parseFloat(parts[2]);
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            data.push(r, g, b, 1.0); // RGBA format for WebGL texture
          }
        }
      }
    }

    return {
      size,
      data: new Float32Array(data)
    };
  }

  public static createLUTTexture(gl: WebGL2RenderingContext, lut: { size: number, data: Float32Array }): WebGLTexture {
    const tex = gl.createTexture();
    if (!tex) throw new Error('Failed to create LUT Texture');

    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.RGBA16F, // float16 internal format for precision
      lut.size,
      lut.size,
      lut.size,
      0,
      gl.RGBA,
      gl.FLOAT,
      lut.data
    );

    return tex;
  }
}
