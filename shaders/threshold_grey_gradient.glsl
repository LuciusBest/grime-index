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
    vec3 topColor = vec3(1.0, 0.2, 0.2);    // proche de #FF3333 (rouge clair)
    vec3 bottomColor = vec3(1.0, 0.2, 0.2); // gris foncé
    float t = v_texCoord.y;  // 0 = bas, 1 = haut
    vec3 gradientColor = mix(bottomColor, topColor, t);
    gl_FragColor = vec4(gradientColor, 1.0);
  }
}
