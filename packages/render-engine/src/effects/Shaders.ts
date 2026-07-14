export const BlurShader = {
  // Vertex shader is usually a standard pass-through for screen quads
  vertex: `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `,

  // Fragment shader utilizing a two-pass linear blur (Horizontal then Vertical)
  // This is a stub demonstrating the structure.
  fragment: `#version 300 es
    precision highp float;
    
    uniform sampler2D u_image;
    uniform vec2 u_resolution;
    uniform vec2 u_direction; // [1.0, 0.0] for horizontal, [0.0, 1.0] for vertical
    uniform float u_radius;   // Blur radius
    
    in vec2 v_texCoord;
    out vec4 outColor;
    
    void main() {
      vec4 color = vec4(0.0);
      vec2 texel = 1.0 / u_resolution;
      float totalWeight = 0.0;
      
      // Simple box blur approximation for demonstration
      // A true implementation would use a Gaussian kernel or Kawase blur
      int samples = int(u_radius);
      for (int i = -samples; i <= samples; i++) {
        vec2 offset = vec2(float(i)) * u_direction * texel;
        float weight = 1.0 - (abs(float(i)) / float(samples)); // Basic triangular weighting
        
        color += texture(u_image, v_texCoord + offset) * weight;
        totalWeight += weight;
      }
      
      outColor = color / totalWeight;
    }
  `
};

export const GlitchShader = {
  fragment: `#version 300 es
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    
    in vec2 v_texCoord;
    out vec4 outColor;
    
    // Pseudo-random noise
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    
    void main() {
      vec2 uv = v_texCoord;
      
      // Horizontal displacement
      float jitter = (rand(vec2(uv.y, u_time)) - 0.5) * u_intensity * 0.1;
      uv.x += jitter;
      
      // RGB Split
      float r = texture(u_image, uv + vec2(u_intensity * 0.02, 0.0)).r;
      float g = texture(u_image, uv).g;
      float b = texture(u_image, uv - vec2(u_intensity * 0.02, 0.0)).b;
      
      outColor = vec4(r, g, b, 1.0);
    }
  `
};
