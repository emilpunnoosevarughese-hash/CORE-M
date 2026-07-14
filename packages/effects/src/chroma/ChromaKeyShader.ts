/**
 * ChromaKeyShader
 * WebGL-based Green/Blue Screen removal.
 */

export const ChromaKeyFragmentShader = `
precision highp float;

uniform sampler2D u_image;
uniform vec3 u_keyColor;
uniform float u_similarity;
uniform float u_smoothness;
uniform float u_spill;

varying vec2 v_texCoord;

vec2 rgb2ycbcr(vec3 c) {
  float y = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  float cb = -0.1687 * c.r - 0.3313 * c.g + 0.5 * c.b + 0.5;
  float cr = 0.5 * c.r - 0.4187 * c.g - 0.0813 * c.b + 0.5;
  return vec2(cb, cr);
}

void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  vec2 chrom = rgb2ycbcr(color.rgb);
  vec2 keyChrom = rgb2ycbcr(u_keyColor);
  
  float dist = distance(chrom, keyChrom);
  
  float baseMask = dist - u_similarity;
  float fullMask = pow(clamp(baseMask / u_smoothness, 0.0, 1.0), 1.5);
  
  // Basic spill suppression (reduce green channel if key is green)
  float spillVal = (color.g - (color.r + color.b) / 2.0);
  if (spillVal > 0.0 && u_keyColor.g > u_keyColor.r) {
    color.g -= spillVal * u_spill;
  }
  
  gl_FragColor = vec4(color.rgb, color.a * fullMask);
}
`;
