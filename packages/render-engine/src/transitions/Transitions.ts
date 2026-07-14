export const Transitions = {
  Crossfade: `#version 300 es
    precision mediump float;
    uniform sampler2D u_imageA;
    uniform sampler2D u_imageB;
    uniform float u_progress; // 0.0 to 1.0
    
    in vec2 v_texCoord;
    out vec4 outColor;
    
    void main() {
      vec4 a = texture(u_imageA, v_texCoord);
      vec4 b = texture(u_imageB, v_texCoord);
      outColor = mix(a, b, u_progress);
    }
  `,

  Zoom: `#version 300 es
    precision mediump float;
    uniform sampler2D u_imageA;
    uniform sampler2D u_imageB;
    uniform float u_progress;
    
    in vec2 v_texCoord;
    out vec4 outColor;
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      
      // Image A zooms in and fades
      vec2 uvA = center + (v_texCoord - center) * (1.0 - (u_progress * 0.5));
      vec4 a = texture(u_imageA, uvA) * (1.0 - u_progress);
      
      // Image B zooms down from large scale
      vec2 uvB = center + (v_texCoord - center) * (1.0 + ((1.0 - u_progress) * 0.5));
      vec4 b = texture(u_imageB, uvB) * u_progress;
      
      outColor = a + b; // Additive blend for standard transition math
    }
  `
};
