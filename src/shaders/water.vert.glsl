uniform float uTime;
uniform float uWaveHeight;

varying float vHeight;
varying vec3 vWorldPosition;
varying vec3 vNormal;

// Gerstner wave function
vec3 gerstnerWave(vec2 pos, float steepness, float wavelength, vec2 direction, float time) {
    float k = 2.0 * 3.14159 / wavelength;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(direction);
    float f = k * (dot(d, pos) - c * time);
    float a = steepness / k;
    return vec3(
        d.x * a * cos(f),
        a * sin(f),
        d.y * a * cos(f)
    );
}

void main() {
    vec3 pos = position;

    // Wave 1: Large slow swell
    vec3 w1 = gerstnerWave(pos.xz, 0.15, 25.0, vec2(1.0, 0.6), uTime * 0.8);
    // Wave 2: Medium waves
    vec3 w2 = gerstnerWave(pos.xz, 0.2, 12.0, vec2(-0.5, 1.0), uTime * 1.2);
    // Wave 3: Small choppy waves
    vec3 w3 = gerstnerWave(pos.xz, 0.1, 6.0, vec2(0.7, -0.3), uTime * 1.6);

    pos += w1 + w2 + w3;
    pos.y *= uWaveHeight;

    vHeight = pos.y;
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    vNormal = normalMatrix * normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
