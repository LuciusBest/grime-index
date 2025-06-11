precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_mouse;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  
  float gray = (color.r + color.g + color.b) / 3.0;
  gray = min(gray * 1.15, 1.0); // éclaircir globalement

  vec3 result;
  if (gray < 0.33) {
    result = vec3(0.0); // noir
  } else if (gray < 0.66) {
    result = vec3(0.0, 1.0, 0.5); // vert fluo
  } else {
    result = vec3(0.7); // gris métallique
  }

  vec2 fragCoord = gl_FragCoord.xy;
  vec2 mouse = u_mouse * u_resolution;

  float ellipse = pow((fragCoord.x - mouse.x) / 400.0, 2.0) + pow((fragCoord.y - mouse.y) / 150.0, 2.0);
  float highlight = 1.0 - smoothstep(0.0, 1.0, ellipse);

  if (gray >= 0.66) {
    result += vec3(highlight);
  }

  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
