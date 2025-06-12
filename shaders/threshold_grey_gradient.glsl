precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_texCoord;

void main() {
  vec3 color = texture2D(u_texture, v_texCoord).rgb;

  // Niveau de gris
  float g = dot(color, vec3(0.299, 0.587, 0.114));
  float threshold = 0.22;

  if (g >= threshold) {
    discard;
  } else {
    vec3 red = vec3(1.0, 0.0, 0.0);
    gl_FragColor = vec4(red, 1.0);
  }
}
