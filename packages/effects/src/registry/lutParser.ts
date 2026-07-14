export interface ParsedLUT {
  size: number;
  data: Float32Array; // RGB RGB RGB ...
  title?: string;
  min?: [number, number, number];
  max?: [number, number, number];
}

export function parseCubeLUT(cubeText: string): ParsedLUT {
  const lines = cubeText.split('\n');
  let size = 0;
  let title = '';
  const data: number[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('TITLE')) {
      title = line.replace('TITLE', '').replace(/"/g, '').trim();
    } else if (line.startsWith('LUT_3D_SIZE')) {
      size = parseInt(line.split(/\s+/)[1], 10);
    } else if (line.startsWith('DOMAIN_MIN') || line.startsWith('DOMAIN_MAX')) {
      // Ignoring domains for basic implementation
    } else {
      // Must be data
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        data.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
      }
    }
  }

  if (size === 0 || data.length !== size * size * size * 3) {
    throw new Error('Invalid or unsupported .cube file format');
  }

  return {
    size,
    title,
    data: new Float32Array(data)
  };
}
