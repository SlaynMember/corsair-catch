uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform float uFoamThreshold;

varying float vHeight;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    // Depth-based color blend
    float depth = smoothstep(-1.0, 2.0, vHeight);
    vec3 waterColor = mix(uDeepColor, uShallowColor, depth);

    // Foam at wave crests
    float foam = smoothstep(uFoamThreshold - 0.2, uFoamThreshold, vHeight);
    waterColor = mix(waterColor, uFoamColor, foam * 0.6);

    // Simple fresnel-like rim
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 3.0);
    waterColor += fresnel * 0.15;

    gl_FragColor = vec4(waterColor, 0.92);
}
