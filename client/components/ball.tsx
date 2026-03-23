"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Basketball: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    // Procedural Basketball Shader
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;

      uniform float uTime;

      // Simple hash function for noise
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      // 3D Noise
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                       mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                       mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
      }

      // Fractal Brownian Motion for more natural variation
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      // Pebbled texture with slight irregularity
      float pebbled(vec3 p) {
        float n = noise(p * 180.0 + noise(p * 10.0) * 2.0);
        return smoothstep(0.3, 0.7, n);
      }

      // Basketball lines logic
      float basketballLines(vec3 p) {
        float thickness = 0.015;
        float edge = 0.005;
        
        // Vertical line
        float d1 = abs(p.x);
        // Horizontal line
        float d2 = abs(p.y);
        // Side curves
        float d3 = abs(length(p.xz) - 0.707);
        float d4 = abs(length(p.yz) - 0.707);
        
        float lines = min(min(d1, d2), min(d3, d4));
        return 1.0 - smoothstep(thickness - edge, thickness + edge, lines);
      }

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 pos = normalize(vPosition);
        
        // Large scale wear/dirt variation
        float wear = fbm(pos * 2.0);
        float dirt = fbm(pos * 5.0 + 10.0);
        
        // Perturb normal for bump mapping
        float eps = 0.005;
        float p0 = pebbled(pos);
        float px = pebbled(pos + vec3(eps, 0, 0));
        float py = pebbled(pos + vec3(0, eps, 0));
        float pz = pebbled(pos + vec3(0, 0, eps));
        
        vec3 bump = vec3(px - p0, py - p0, pz - p0) / eps;
        normal = normalize(normal - bump * 0.15);

        // Lighting
        vec3 lightDir = normalize(vec3(5.0, 5.0, 5.0));
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular variation (worn areas are less shiny)
        vec3 viewDir = normalize(vec3(0.0, 0.0, 2.5) - vPosition);
        vec3 reflectDir = reflect(-lightDir, normal);
        float specIntensity = mix(0.1, 0.3, wear);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0) * specIntensity;

        // Base color (Orange) with rich variation
        vec3 baseOrange = vec3(0.85, 0.35, 0.12);
        vec3 wornOrange = vec3(0.7, 0.3, 0.1);
        vec3 dirtColor = vec3(0.3, 0.2, 0.1);
        
        vec3 orange = mix(wornOrange, baseOrange, wear);
        orange = mix(orange, dirtColor, dirt * 0.3);
        
        vec3 darkOrange = orange * 0.5;
        
        // Pebbles
        float p = pebbled(pos);
        vec3 color = mix(darkOrange, orange, p);

        // Lines
        float lines = basketballLines(pos);
        color = mix(color, vec3(0.02, 0.02, 0.02), lines);

        // Final shading
        color = color * (diff * 0.8 + 0.2) + spec;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 }
      }
    });

    const ball = new THREE.Mesh(geometry, material);
    scene.add(ball);

    // Animation loop
    const animate = (time: number) => {
      requestAnimationFrame(animate);
      ball.rotation.y += 0.005;
      ball.rotation.x += 0.002;
      material.uniforms.uTime.value = time * 0.001;
      renderer.render(scene, camera);
    };

    animate(0);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-black flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-8 left-8 text-white/50 font-mono text-xs uppercase tracking-widest pointer-events-none">
        {/* Procedural Basketball Texture // GLSL Noise */}
      </div>
    </div>
  );
};

export default Basketball;
