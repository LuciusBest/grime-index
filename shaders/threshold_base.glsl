precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_texCoord;

void main() {
  vec3 color = texture2D(u_texture, v_texCoord).rgb;

  // Niveau de gris
  float g = dot(color, vec3(0.299, 0.587, 0.114));

  // Seuil pour décider si on garde le pixel
  float threshold = 0.22;

  // Si pixel trop lumineux → transparent
  // Sinon → noir opaque
  if (g >= threshold) {
    discard; // rend transparent
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // noir opaque
  }
}
