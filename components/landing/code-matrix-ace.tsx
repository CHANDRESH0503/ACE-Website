"use client";

import { useEffect, useRef } from "react";

// A density ramp, lightest to heaviest. A glyph's weight follows the cell's depth inside
// the letterform plus the lens heat, so the word reads with tone instead of flat noise.
const GLYPHS = ".:-=+/<>!?;()[]{}10$%&#CEA@".split("");
const L = GLYPHS.length;

/**
 * "ACE" set as a field of code glyphs on the Signal Blue ground.
 *
 * Tone: each cell's depth inside the letters (a blurred mask) picks its glyph from a
 * density ramp, light at the edges and heavy in the core; glyphs shimmer within a
 * narrow band of that weight (the approach of Aino's ASCII work, Awwwards SOTD 2026).
 *
 * Every glyph sits on a spring. An eased cursor (a frame-rate independent lerp, never
 * the raw pointer) pushes glyphs out of its path and drags them along its velocity, so
 * the field parts like water and settles back with a slight overshoot. Near the lens,
 * glyphs crossfade to white and re-type faster; dots outside the letters surface as
 * glyphs. A click or tap sends a shockwave ring through the field. With no pointer
 * (phones, or the mouse elsewhere) a ghost cursor drifts so the field stays alive.
 *
 * Drawn from a pre-rendered glyph atlas on one canvas, only while on screen.
 * Reduced motion renders one still frame.
 */
export function CodeMatrixACE({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rootStyle = () => getComputedStyle(document.documentElement);

    let W = 0, H = 0, dpr = 1, cell = 14, cols = 0, rows = 0, N = 0;
    let mask = new Uint8Array(0);
    let glyph = new Uint8Array(0);
    let ox = new Float32Array(0), oy = new Float32Array(0);
    let vx = new Float32Array(0), vy = new Float32Array(0);
    let heat = new Float32Array(0);
    let tone = new Float32Array(0);
    let clicked = false;
    let atlas: HTMLCanvasElement | null = null;
    let atlasCell = 0;
    let ink = "#07080b", ground = "#0a6cff";
    let monoFamily = "ui-monospace, monospace";
    let bodyFamily = "ui-sans-serif, system-ui, sans-serif";

    // Cursor: raw target, eased position, eased velocity, and presence (0..1).
    let tx = 0, ty = 0, sx = 0, sy = 0, svx = 0, svy = 0;
    let presence = 0;
    let pointerIn = false;
    let lastPointer = -1e9;
    let rings: { x: number; y: number; t: number }[] = [];

    let raf = 0, visible = false, running = false, last = 0, clock = 0;

    const hsl = (v: string, fallback: string) => {
      const p = rootStyle().getPropertyValue(v).trim().split(/\s+/);
      return p.length === 3 ? `hsl(${p[0]} ${p[1]} ${p[2]})` : fallback;
    };

    const buildAtlas = () => {
      atlasCell = Math.ceil(cell * dpr);
      atlas = document.createElement("canvas");
      atlas.width = atlasCell * GLYPHS.length;
      atlas.height = atlasCell * 2;
      const a = atlas.getContext("2d")!;
      a.font = `600 ${Math.round(cell * 0.82 * dpr)}px ${monoFamily}`;
      a.textAlign = "center";
      a.textBaseline = "middle";
      GLYPHS.forEach((g, i) => {
        a.fillStyle = ink;
        a.fillText(g, i * atlasCell + atlasCell / 2, atlasCell / 2);
        a.fillStyle = "#ffffff";
        a.fillText(g, i * atlasCell + atlasCell / 2, atlasCell * 1.5);
      });
    };

    const build = () => {
      // Layout size, not the transformed box: the parent scales this canvas on scroll.
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const portrait = H > W * 1.2;
      cell = portrait ? Math.max(8, Math.round(W / 34)) : Math.max(10, Math.round(Math.min(W, H) / 52));
      cols = Math.ceil(W / cell);
      rows = Math.ceil(H / cell);
      N = cols * rows;

      // Rasterise the word at cell resolution (A / C / E stacked on tall screens).
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      const family = getComputedStyle(document.body).fontFamily;
      bodyFamily = family;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      if (portrait) {
        let size = Math.min(rows * 0.3, cols * 1.2);
        o.font = `800 ${size}px ${family}`;
        const w = Math.max(...["A", "C", "E"].map((l) => o.measureText(l).width));
        if (w > cols * 0.9) size *= (cols * 0.9) / w;
        o.font = `800 ${size}px ${family}`;
        ["A", "C", "E"].forEach((l, k) => o.fillText(l, cols / 2, rows * (0.19 + k * 0.23)));
      } else {
        let size = rows * 0.62;
        o.font = `800 ${size}px ${family}`;
        const w = o.measureText("ACE").width;
        if (w > cols * 0.86) size *= (cols * 0.86) / w;
        o.font = `800 ${size}px ${family}`;
        o.fillText("ACE", cols / 2, rows * 0.52);
      }
      const data = o.getImageData(0, 0, cols, rows).data;
      mask = new Uint8Array(N);
      for (let i = 0; i < N; i++) mask[i] = data[i * 4 + 3] > 110 ? 1 : 0;
      // Depth inside the letters: a separable box blur of the mask.
      const rad = Math.max(2, Math.round(Math.min(cols, rows) / 28));
      const tmp = new Float32Array(N);
      tone = new Float32Array(N);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let sum = 0, n = 0;
          for (let k = -rad; k <= rad; k++) {
            const xx = x + k;
            if (xx >= 0 && xx < cols) { sum += mask[y * cols + xx]; n++; }
          }
          tmp[y * cols + x] = sum / n;
        }
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let sum = 0, n = 0;
          for (let k = -rad; k <= rad; k++) {
            const yy = y + k;
            if (yy >= 0 && yy < rows) { sum += tmp[yy * cols + x]; n++; }
          }
          const i = y * cols + x;
          tone[i] = mask[i] ? Math.min(1, 0.18 + (sum / n) * 0.95) : 0;
        }
      }
      glyph = new Uint8Array(N);
      for (let i = 0; i < N; i++) glyph[i] = pick(tone[i]);
      ox = new Float32Array(N); oy = new Float32Array(N);
      vx = new Float32Array(N); vy = new Float32Array(N);
      heat = new Float32Array(N);

      ground = hsl("--signal", ground);
      ink = hsl("--signal-foreground", ink);
      monoFamily = rootStyle().getPropertyValue("--font-mono").trim() || monoFamily;
      buildAtlas();
      if (!running) {
        sx = tx = W * 0.5;
        sy = ty = H * 0.5;
      }
      draw();
    };

    // A glyph from a band of the ramp around a 0..1 density level.
    const pick = (level: number) => {
      const c = Math.max(0, Math.min(1, level)) * (L - 1);
      const j = Math.round(c + (Math.random() - 0.5) * 4);
      return Math.max(0, Math.min(L - 1, j));
    };

    const step = (dt: number) => {
      clock += dt;
      const R = Math.max(110, cell * 11);
      const R2 = R * R;

      // Ghost cursor when no pointer has moved over the field for a while.
      const idle = !pointerIn && clock * 1000 - lastPointer > 1400;
      if (idle) {
        tx = W * (0.5 + 0.34 * Math.sin(clock * 0.37));
        ty = H * (0.52 + 0.24 * Math.sin(clock * 0.61 + 1.3));
      }
      const presenceTarget = pointerIn ? 1 : idle ? 0.55 : 0.8;
      presence += (presenceTarget - presence) * (1 - Math.exp(-dt * 3));

      // Eased cursor: a critically damped spring (SmoothDamp). Velocity stays continuous,
      // so the lens eases into motion, never overshoots, and settles in ~190ms (ghost: slower).
      const smoothTime = idle ? 0.45 : 0.08;
      const omega = 2 / smoothTime;
      const xk = omega * dt;
      const decay = 1 / (1 + xk + 0.48 * xk * xk + 0.235 * xk * xk * xk);
      const ax = sx - tx, ay = sy - ty;
      const gx = (svx + omega * ax) * dt, gy = (svy + omega * ay) * dt;
      svx = (svx - omega * gx) * decay;
      svy = (svy - omega * gy) * decay;
      sx = tx + (ax + gx) * decay;
      sy = ty + (ay + gy) * decay;
      const cvx = Math.max(-2200, Math.min(2200, svx));
      const cvy = Math.max(-2200, Math.min(2200, svy));

      rings = rings.filter((r) => clock - r.t < 1.3);

      const PUSH = cell * 210;
      const DRAG = 1.1;
      const SPRING = 110;
      const DAMP = 13;
      const heatUp = 1 - Math.exp(-dt * 18);
      const heatDown = 1 - Math.exp(-dt * 2.4);
      const baseRate = dt * 0.7;

      for (let y = 0, i = 0; y < rows; y++) {
        const cy = y * cell + cell / 2;
        for (let x = 0; x < cols; x++, i++) {
          const cx = x * cell + cell / 2;
          let fx = 0, fy = 0, ht = 0;

          const dx = cx - sx, dy = cy - sy;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1;
            const f = 1 - d / R;
            const f2 = f * f * presence;
            fx += (dx / d) * f2 * PUSH + cvx * f2 * DRAG;
            fy += (dy / d) * f2 * PUSH + cvy * f2 * DRAG;
            ht = f * presence;
          }

          for (let r = 0; r < rings.length; r++) {
            const ring = rings[r];
            const age = clock - ring.t;
            const radius = age * 900;
            const rx = cx - ring.x, ry = cy - ring.y;
            const rd = Math.sqrt(rx * rx + ry * ry) || 1;
            const band = 1 - Math.abs(rd - radius) / (cell * 4);
            if (band > 0) {
              const s = band * (1 - age / 1.3) * PUSH * 1.8;
              fx += (rx / rd) * s;
              fy += (ry / rd) * s;
              ht = Math.max(ht, band * (1 - age / 1.3));
            }
          }

          // Semi-implicit spring back to rest, slightly underdamped.
          const vxi = vx[i] + (fx - SPRING * ox[i] - DAMP * vx[i]) * dt;
          const vyi = vy[i] + (fy - SPRING * oy[i] - DAMP * vy[i]) * dt;
          vx[i] = vxi;
          vy[i] = vyi;
          ox[i] += vxi * dt;
          oy[i] += vyi * dt;

          const h = heat[i];
          heat[i] = h + (ht - h) * (ht > h ? heatUp : heatDown);

          if (mask[i] || heat[i] > 0.15) {
            if (Math.random() < baseRate + heat[i] * dt * 16) {
              glyph[i] = pick(mask[i] ? tone[i] + heat[i] * 0.5 : heat[i] * 0.55);
            }
          }
        }
      }
    };

    const draw = () => {
      if (!atlas) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, W, H);

      // Dot grid outside the letters, one path.
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = ink;
      ctx.beginPath();
      for (let y = 0, i = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++, i++) {
          if (mask[i] || heat[i] > 0.15) continue;
          ctx.rect(x * cell + cell / 2 + ox[i] - 1, y * cell + cell / 2 + oy[i] - 1, 2, 2);
        }
      }
      ctx.fill();

      // Glyphs: ink crossfading to white with heat.
      const s = atlasCell;
      for (let y = 0, i = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++, i++) {
          const h = heat[i];
          let a: number;
          if (mask[i]) a = 0.8 + h * 0.2;
          else if (h > 0.15) a = Math.min(1, (h - 0.15) / 0.5);
          else continue;
          const px = x * cell + ox[i];
          const py = y * cell + oy[i];
          const sxA = glyph[i] * s;
          const w = Math.min(1, h * 1.6);
          if (w < 0.98) {
            ctx.globalAlpha = a * (1 - w);
            ctx.drawImage(atlas, sxA, 0, s, s, px, py, cell, cell);
          }
          if (w > 0.02) {
            ctx.globalAlpha = a * w;
            ctx.drawImage(atlas, sxA, s, s, s, px, py, cell, cell);
          }
        }
      }

      // Lens: a hairline ring and mono coordinates riding the eased cursor.
      if (presence > 0.02) {
        const r = Math.max(110, cell * 11) * 0.42;
        ctx.globalAlpha = presence * 0.9;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx - 6, sy); ctx.lineTo(sx + 6, sy);
        ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6);
        ctx.stroke();
        ctx.font = `500 11px ${monoFamily}`;
        ctx.textBaseline = "top";
        ctx.fillStyle = "#ffffff";
        const fmt = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");
        const label = `X ${fmt(sx)}  Y ${fmt(sy)}`;
        const lw = ctx.measureText(label).width;
        // Flip the readout to the lens's other side near the right or bottom edge.
        const right = sx + r * 0.72 + 8 + lw < W - 8;
        const below = sy + r * 0.72 + 22 < H;
        ctx.textAlign = right ? "left" : "right";
        const lx = right ? sx + r * 0.72 + 8 : sx - r * 0.72 - 8;
        const ly = below ? sy + r * 0.72 + 4 : sy - r * 0.72 - 16;
        ctx.fillText(label, lx, ly);
        // Until the first click, the lens carries its own hint in the label voice.
        if (!clicked) {
          ctx.font = `600 11.5px ${bodyFamily}`;
          ctx.letterSpacing = "0.08em";
          ctx.fillText("CLICK", lx, ly + 16);
          ctx.letterSpacing = "0px";
        }
      }
      for (const ring of rings) {
        const age = clock - ring.t;
        ctx.globalAlpha = Math.max(0, 0.6 * (1 - age / 1.3));
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, age * 900, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(1 / 30, Math.max(1 / 240, (t - last) / 1000 || 1 / 60));
      last = t;
      step(dt);
      draw();
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Map viewport pointer coordinates into the canvas's own (untransformed) space.
    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const y = ((e.clientY - r.top) / r.height) * H;
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      return { x, y, inside };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      pointerIn = p.inside;
      if (p.inside) {
        tx = p.x;
        ty = p.y;
        lastPointer = clock * 1000;
      }
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      if (!p.inside || !visible) return;
      tx = p.x;
      ty = p.y;
      lastPointer = clock * 1000;
      rings.push({ x: p.x, y: p.y, t: clock });
      clicked = true;
      if (rings.length > 4) rings.shift();
    };
    const onOut = () => { pointerIn = false; };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const mo = new MutationObserver(build);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    if (!reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onOut);
      window.addEventListener("pointercancel", onOut);
    }
    document.fonts?.ready.then(build);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onOut);
      window.removeEventListener("pointercancel", onOut);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
