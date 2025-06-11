precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

float getLuminance(vec2 coord) {
  vec3 color = texture2D(u_texture, coord).rgb;
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  float threshold = 0.22;
  float g = getLuminance(v_texCoord);

  // Calcul des voisins pour détecter les bords
  vec2 texel = 1.0 / u_resolution;

  float gx1 = getLuminance(v_texCoord + vec2(texel.x, 0.0));
  float gx2 = getLuminance(v_texCoord - vec2(texel.x, 0.0));
  float gy1 = getLuminance(v_texCoord + vec2(0.0, texel.y));
  float gy2 = getLuminance(v_texCoord - vec2(0.0, texel.y));

  bool isEdge = (
    g < threshold &&
    (gx1 >= threshold || gx2 >= threshold || gy1 >= threshold || gy2 >= threshold)
  );

  if (g >= threshold) {
    discard;
  } else if (isEdge) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Contour noir
  } else {
    // Dégradé du bas (0) vers le haut (1)
    vec3 topColor = vec3(0.85);
    vec3 bottomColor = vec3(0.2);
    float t = v_texCoord.y;
    vec3 gradientColor = mix(bottomColor, topColor, t);
    gl_FragColor = vec4(gradientColor, 1.0);
  }
}
