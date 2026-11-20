"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The ACE mark assembled from particles.
 * Points are sampled from the white glyph of /logo.svg (triangle, semicolon cut, "./ace").
 * They fly in from a scattered cloud, breathe, part around the pointer, and
 * dissolve back into the cloud as the hero scrolls away.
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uScatter;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec3 aTarget;
  attribute vec3 aCloud;
  attribute float aSeed;
  varying float vSeed;
  varying float vLift;

  float easeOutExpo(float x) { return x >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * x); }

  void main() {
    vSeed = aSeed;
    // Staggered assembly: every point has its own delay.
    float t = clamp((uAssemble - aSeed * 0.45) / 0.55, 0.0, 1.0);
    float k = easeOutExpo(t);
    vec3 pos = mix(aCloud, aTarget, k);

    // Idle breathing along z and a faint drift.
    pos.z += sin(uTime * 0.9 + aSeed * 40.0) * 0.035;
    pos.xy += vec2(sin(uTime * 0.6 + aSeed * 17.0), cos(uTime * 0.5 + aSeed * 23.0)) * 0.006;

    // Pointer parts the particles.
    vec2 d = pos.xy - uPointer;
    float dist = length(d);
    float push = smoothstep(0.42, 0.0, dist) * uPointerStrength;
    pos.xy += normalize(d + 0.0001) * push * 0.22;
    pos.z += push * 0.35;
    vLift = push;

    // Scroll dissolve back into the cloud, pushed outward and toward camera.
    vec3 away = aCloud * 1.8 + vec3(0.0, 0.0, 1.2 * aSeed);
    pos = mix(pos, away, smoothstep(0.0, 1.0, uScatter));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.6 + aSeed * 0.8) * (1.0 + vLift * 1.4);
    gl_PointSize = size * uPixelRatio * (3.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uSignal;
  uniform float uOpacity;
  varying float vSeed;
  varying float vLift;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.22, r);
    // About one in six points carries ACE blue; lifted points light up blue.
    float blue = step(0.84, vSeed) + vLift;
    vec3 col = mix(uInk, uSignal, clamp(blue, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

// Ambient depth field: points spread through the whole frustum, drifting slowly,
// sized and faded by depth, with pointer parallax. Normalised coords are mapped
// to the visible area at each point's depth so the field is always full-bleed.
const AMB_VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uHalf;
  uniform float uCamZ;
  uniform vec2 uParallax;
  uniform float uScatter;
  uniform float uPixelRatio;
  uniform float uLow;
  uniform float uHigh;
  attribute vec3 aUvz;
  attribute float aSeed;
  varying float vSeed;
  varying float vDepth;
  varying float vMask;
  void main() {
    vSeed = aSeed;
    float z = aUvz.z;
    float k = (uCamZ - z) / uCamZ;
    float v = fract(aUvz.y * 0.5 + 0.5 + uTime * (0.004 + aSeed * 0.006)) * 2.0 - 1.0;
    float u = aUvz.x + sin(uTime * 0.2 + aSeed * 30.0) * 0.01;
    vec3 pos = vec3(u * uHalf.x * k * 1.08, v * uHalf.y * k * 1.08, z);
    float depth = clamp((z + 4.0) / 5.5, 0.0, 1.0); // 0 far, 1 near
    vDepth = depth;
    pos.xy += uParallax * (0.05 + depth * 0.35);
    pos.z += uScatter * (1.0 + depth * 2.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // Keep text areas clean: fade the field below the headline band and over the corner data.
    float ny = gl_Position.y / gl_Position.w;
    vMask = smoothstep(uLow - 0.22, uLow, ny) * (1.0 - smoothstep(uHigh - 0.1, uHigh, ny));
    gl_PointSize = (1.1 + depth * depth * 4.2 + aSeed * 0.8) * uPixelRatio * (3.0 / -mv.z);
  }
`;

const AMB_FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uSignal;
  uniform float uOpacity;
  uniform float uStrength;
  varying float vSeed;
  varying float vDepth;
  varying float vMask;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    // near points are soft (out of focus), far points are crisp and faint
    float soft = mix(0.32, 0.05, vDepth);
    float alpha = smoothstep(0.5, soft, r) * mix(0.18, 0.55, vDepth);
    vec3 col = mix(uInk, uSignal, step(0.78, vSeed));
    gl_FragColor = vec4(col, alpha * uOpacity * uStrength * vMask);
  }
`;

function cssColor(varName: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  // tokens are "H S% L%" triplets
  const [h, s, l] = raw.split(/\s+/).map((v) => parseFloat(v));
  const c = new THREE.Color();
  if (Number.isFinite(h)) c.setHSL(h / 360, s / 100, l / 100, THREE.SRGBColorSpace);
  return c;
}

async function sampleLogo(count: number): Promise<Float32Array> {
  const img = new Image();
  img.src = "/logo.svg";
  await img.decode();
  const S = 280;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, S, S);
  const { data } = ctx.getImageData(0, 0, S, S);
  const candidates: number[] = [];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // the glyph is white; the roundel is blue
      if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200 && data[i + 3] > 200) {
        candidates.push(x, y);
        // the thin "./ace" strokes get extra weight so the wordmark reads
        if (y > S * 0.68) candidates.push(x, y, x, y);
      }
    }
  }
  const out = new Float32Array(count * 3);
  const n = candidates.length / 2;
  for (let p = 0; p < count; p++) {
    const k = Math.floor(Math.random() * n) * 2;
    const jx = (Math.random() - 0.5) * 1.2;
    const jy = (Math.random() - 0.5) * 1.2;
    out[p * 3] = ((candidates[k] + jx) / S - 0.5) * 2.0;
    out[p * 3 + 1] = -((candidates[k + 1] + jy) / S - 0.5) * 2.0;
    // the "./ace" wordmark (lower part of the glyph) stays nearly flat so it reads
    out[p * 3 + 2] = (Math.random() - 0.5) * (candidates[k + 1] > S * 0.68 ? 0.015 : 0.22);
  }
  return out;
}

export function ParticleMark({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hostEl = hostRef.current;
    if (!hostEl) return;
    const host: HTMLDivElement = hostEl;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    const COUNT = small ? 4200 : 9000;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0, 4.2);

    const uniforms = {
      uTime: { value: 0 },
      uAssemble: { value: reduce ? 1 : 0 },
      uScatter: { value: 0 },
      uPointer: { value: new THREE.Vector2(9, 9) },
      uPointerStrength: { value: 0 },
      uSize: { value: small ? 2.4 : 2.3 },
      uPixelRatio: { value: pixelRatio },
      uInk: { value: cssColor("--foreground") },
      uSignal: { value: cssColor("--primary") },
      uOpacity: { value: 1 },
    };

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const AMB = small ? 900 : 2200;
    const ambUvz = new Float32Array(AMB * 3);
    const ambSeed = new Float32Array(AMB);
    for (let i = 0; i < AMB; i++) {
      ambUvz[i * 3] = Math.random() * 2 - 1;
      ambUvz[i * 3 + 1] = Math.random() * 2 - 1;
      ambUvz[i * 3 + 2] = -4 + Math.pow(Math.random(), 0.8) * 5.5;
      ambSeed[i] = Math.random();
    }
    const ambGeometry = new THREE.BufferGeometry();
    ambGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(AMB * 3), 3));
    ambGeometry.setAttribute("aUvz", new THREE.BufferAttribute(ambUvz, 3));
    ambGeometry.setAttribute("aSeed", new THREE.BufferAttribute(ambSeed, 1));
    ambGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    const ambUniforms = {
      uTime: uniforms.uTime,
      uHalf: { value: new THREE.Vector2(1, 1) },
      uCamZ: { value: camera.position.z },
      uParallax: { value: new THREE.Vector2() },
      uScatter: uniforms.uScatter,
      uPixelRatio: uniforms.uPixelRatio,
      uInk: uniforms.uInk,
      uSignal: uniforms.uSignal,
      uOpacity: { value: 0 },
      uStrength: { value: document.documentElement.classList.contains("dark") ? 1 : 0.55 },
      uLow: { value: -0.2 },
      uHigh: { value: 0.66 },
    };
    const ambMaterial = new THREE.ShaderMaterial({
      vertexShader: AMB_VERT,
      fragmentShader: AMB_FRAG,
      uniforms: ambUniforms,
      transparent: true,
      depthWrite: false,
    });
    const ambient = new THREE.Points(ambGeometry, ambMaterial);
    ambient.renderOrder = -1;
    scene.add(ambient);
    const parallaxTarget = new THREE.Vector2();

    let disposed = false;
    let ready = false;

    sampleLogo(COUNT)
      .then((targets) => {
        if (disposed) return;
        const cloud = new Float32Array(COUNT * 3);
        const seeds = new Float32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
          // spherical shell cloud
          const u = Math.random() * 2 - 1;
          const th = Math.random() * Math.PI * 2;
          const r = 1.6 + Math.random() * 1.6;
          const s = Math.sqrt(1 - u * u);
          cloud[i * 3] = r * s * Math.cos(th);
          cloud[i * 3 + 1] = r * s * Math.sin(th) * 0.7;
          cloud[i * 3 + 2] = r * u - 0.5;
          seeds[i] = Math.random();
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(targets.slice(), 3));
        geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
        geometry.setAttribute("aCloud", new THREE.BufferAttribute(cloud, 3));
        geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
        ready = true;
        host.dataset.ready = "true";
        if (reduce) renderOnce();
      })
      .catch(() => setFailed(true));

    // Layout: the mark fills the [data-mark-slot] element inside the host.
    const layout = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const visibleH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const wpp = visibleH / h;
      ambUniforms.uHalf.value.set((visibleH * camera.aspect) / 2, visibleH / 2);
      // Field lives between the corner data and the end of the headline.
      const sec = host.parentElement;
      const corner = sec?.querySelector<HTMLElement>("[data-field-top]");
      const title = sec?.querySelector<HTMLElement>("#hero-title");
      const hostTop = host.getBoundingClientRect().top;
      const toNdc = (px: number) => 1 - (2 * px) / h;
      if (corner) ambUniforms.uHigh.value = toNdc(corner.getBoundingClientRect().bottom - hostTop + 8);
      if (title) ambUniforms.uLow.value = toNdc(title.getBoundingClientRect().bottom - hostTop - 20);
      const slot = host.parentElement?.querySelector<HTMLElement>("[data-mark-slot]");
      const hr = host.getBoundingClientRect();
      if (slot) {
        const r = slot.getBoundingClientRect();
        const cx = r.left - hr.left + r.width / 2;
        const cy = r.top - hr.top + r.height / 2;
        points.scale.setScalar((Math.min(r.width, r.height) / 2) * wpp);
        points.position.set((cx - w / 2) * wpp, -(cy - h / 2) * wpp, 0);
      } else {
        points.scale.setScalar(visibleH * 0.3);
        points.position.set(0, 0, 0);
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(host);
    const slotEl = host.parentElement?.querySelector<HTMLElement>("[data-mark-slot]");
    if (slotEl) ro.observe(slotEl);

    // Pointer in the mark's local space.
    const pointerTarget = new THREE.Vector2(9, 9);
    let pointerActive = 0;
    const ndc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      parallaxTarget.set(ndc.x, ndc.y);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        points.worldToLocal(hit);
        pointerTarget.set(hit.x, hit.y);
        pointerActive = 1;
      }
    };
    const onLeave = () => {
      pointerActive = 0;
    };
    if (!reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    // Theme changes recolour the points.
    const mo = new MutationObserver(() => {
      uniforms.uInk.value = cssColor("--foreground");
      uniforms.uSignal.value = cssColor("--primary");
      ambUniforms.uStrength.value = document.documentElement.classList.contains("dark") ? 1 : 0.55;
      if (reduce) renderOnce();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Only run while visible.
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduce) start();
    });
    io.observe(host);

    const clock = new THREE.Timer();
    clock.connect(document);
    let raf = 0;
    let running = false;
    let assembleStart = -1;

    function renderOnce() {
      if (!ready) return;
      uniforms.uAssemble.value = 1;
      ambUniforms.uOpacity.value = 1;
      renderer.render(scene, camera);
    }

    function frame() {
      if (disposed) return;
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      clock.update();
      const t = clock.getElapsed();
      uniforms.uTime.value = t;

      if (ready) {
        // Wait for the preloader to clear before assembling.
        const preloading = document.documentElement.classList.contains("is-preloading");
        if (!preloading && assembleStart < 0) assembleStart = t;
        if (assembleStart >= 0) {
          uniforms.uAssemble.value = Math.min(1.45, (t - assembleStart) / 2.2 * 1.45);
        }
      }

      // Smooth pointer.
      const p = uniforms.uPointer.value;
      p.lerp(pointerTarget, 0.12);
      uniforms.uPointerStrength.value += (pointerActive - uniforms.uPointerStrength.value) * 0.08;

      // Scroll dissolve over the first viewport.
      const rect = host.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.85)));
      uniforms.uScatter.value = progress;
      uniforms.uOpacity.value = 1 - progress * 0.85;
      const ambIn = assembleStart >= 0 ? Math.min(1, (t - assembleStart) / 1.4) : 0;
      ambUniforms.uOpacity.value = ambIn * (1 - progress);
      ambUniforms.uParallax.value.lerp(parallaxTarget, 0.05);

      // Slow parallax tilt toward the pointer.
      points.rotation.y += ((pointerActive ? p.x * 0.12 : 0) - points.rotation.y) * 0.04;
      points.rotation.x += ((pointerActive ? -p.y * 0.08 : 0) - points.rotation.x) * 0.04;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || disposed) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    const onVis = () => {
      if (!document.hidden && !reduce) start();
    };
    document.addEventListener("visibilitychange", onVis);
    if (!reduce) start();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      geometry.dispose();
      material.dispose();
      clock.dispose();
      ambGeometry.dispose();
      ambMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className={className} aria-hidden="true">
      {failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.svg"
          alt=""
          className="absolute right-[12%] top-1/2 hidden w-[28vw] max-w-md -translate-y-1/2 lg:block"
        />
      )}
    </div>
  );
}
