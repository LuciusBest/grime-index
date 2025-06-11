precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_thresholdLevel;

varying vec2 v_texCoord;

float getLuminance(vec2 coord) {
  vec3 color = texture2D(u_texture, coord).rgb;
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  float g = getLuminance(v_texCoord);
  float levels = max(u_thresholdLevel, 1.0);
  float step = 1.0 / (levels + 1.0); // +1 pour laisser une marge au-dessus
  float maxLumaVisible = step * levels;

  // → Transparence si trop lumineux
  if (g >= maxLumaVisible) {
    discard;
  }

  // Contour detection (facultatif)
  vec2 texel = 1.0 / u_resolution;
  float gx1 = getLuminance(v_texCoord + vec2(texel.x, 0.0));
  float gx2 = getLuminance(v_texCoord - vec2(texel.x, 0.0));
  float gy1 = getLuminance(v_texCoord + vec2(0.0, texel.y));
  float gy2 = getLuminance(v_texCoord - vec2(0.0, texel.y));
  bool isEdge = (
    g < step &&
    (gx1 >= step || gx2 >= step || gy1 >= step || gy2 >= step)
  );

  if (isEdge) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Noir bord
  } else {
    // Calcul du palier de gris (0 = noir, max = presque blanc)
    float levelIndex = floor(g / step);
    float intensity = levelIndex / levels;

    // Dégradé vertical appliqué à chaque niveau
    float verticalT = v_texCoord.y;
    vec3 gradientBase = mix(vec3(0.2), vec3(0.85), verticalT);
    vec3 finalColor = mix(gradientBase, vec3(intensity), 0.5);

    gl_FragColor = vec4(finalColor, 1.0);
  }
}
