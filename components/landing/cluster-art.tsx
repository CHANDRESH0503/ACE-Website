import type { ComponentType, CSSProperties, ReactNode } from "react";

/**
 * Animated line drawings that depict what each ACE cluster does.
 * Strokes use currentColor; accents use --art-accent. Animations only run while
 * the wrapper carries data-active (see .art rules in globals.css). With reduced
 * motion every drawing rests in its finished state.
 */

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={label} className="h-full w-full" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square">
      {children}
    </svg>
  );
}

function WebDev() {
  return (
    <Frame label="A browser window assembling a page layout">
      <rect x="40" y="70" width="320" height="250" />
      <line x1="40" y1="98" x2="360" y2="98" />
      <circle cx="56" cy="84" r="4" /><circle cx="70" cy="84" r="4" /><circle cx="84" cy="84" r="4" />
      <rect x="110" y="78" width="180" height="12" />
      <rect className="a-pop" style={d(0.1)} x="58" y="114" width="284" height="18" fill="var(--art-accent)" stroke="none" />
      <rect className="a-pop" style={d(0.5)} x="58" y="144" width="170" height="78" />
      <line className="a-grow" style={d(0.8)} x1="242" y1="152" x2="340" y2="152" />
      <line className="a-grow" style={d(0.9)} x1="242" y1="166" x2="320" y2="166" />
      <line className="a-grow" style={d(1.0)} x1="242" y1="180" x2="332" y2="180" />
      <rect className="a-pop" style={d(1.2)} x="242" y="196" width="60" height="22" fill="var(--art-accent)" stroke="none" />
      <rect className="a-pop" style={d(1.5)} x="58" y="236" width="88" height="66" />
      <rect className="a-pop" style={d(1.65)} x="156" y="236" width="88" height="66" />
      <rect className="a-pop" style={d(1.8)} x="254" y="236" width="88" height="66" />
      <g className="a-cursor">
        <path d="M0 0 L0 22 L6 16 L11 27 L15 25 L10 14 L18 14 Z" fill="var(--art-accent)" stroke="currentColor" />
      </g>
      <text x="40" y="352" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">&lt;main&gt; … &lt;/main&gt;</text>
    </Frame>
  );
}

function AppDev() {
  return (
    <Frame label="A phone with app screens sliding through it">
      <rect x="130" y="34" width="140" height="300" rx="22" />
      <rect x="178" y="44" width="44" height="10" rx="5" fill="currentColor" />
      <clipPath id="phone-clip"><rect x="140" y="64" width="120" height="250" /></clipPath>
      <g clipPath="url(#phone-clip)">
        <g className="a-scroll-up">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`translate(0 ${i * 70})`}>
              <rect x="148" y="70" width="104" height="58" fill={i % 2 ? "none" : "var(--art-accent)"} stroke={i % 2 ? "currentColor" : "none"} />
              <line x1="156" y1="112" x2={200 + (i % 3) * 14} y2="112" stroke={i % 2 ? "currentColor" : "var(--art-ink, currentColor)"} />
            </g>
          ))}
        </g>
      </g>
      <circle className="a-ripple" cx="200" cy="290" r="18" />
      <circle cx="200" cy="290" r="4" fill="currentColor" />
      <rect x="60" y="120" width="52" height="96" rx="8" className="a-float" />
      <rect x="288" y="150" width="52" height="96" rx="8" className="a-float" style={d(0.8)} />
      <text x="40" y="374" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">build → install → ship</text>
    </Frame>
  );
}

function AIML() {
  const layers = [
    [130, 200, 270],
    [90, 145, 200, 255, 310],
    [90, 145, 200, 255, 310],
    [165, 235],
  ];
  const xs = [70, 160, 250, 335];
  const edges: [number, number, number, number][] = [];
  layers.forEach((col, li) => {
    if (li === layers.length - 1) return;
    col.forEach((y1) => layers[li + 1].forEach((y2) => edges.push([xs[li], y1, xs[li + 1], y2])));
  });
  const lit = [3, 9, 17, 22, 31, 40, 47, 55, 58];
  return (
    <Frame label="A neural network with signals travelling between layers">
      {edges.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.75} opacity={0.55} />
      ))}
      {lit.map((ei, k) => {
        const e = edges[ei % edges.length];
        return (
          <line key={`p${k}`} className="a-signal" style={d(k * 0.22)} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} stroke="var(--art-accent)" strokeWidth={3} pathLength={100} />
        );
      })}
      {layers.map((col, li) =>
        col.map((y, ni) => (
          <circle key={`${li}-${ni}`} className="a-node" style={d(li * 0.35 + ni * 0.08)} cx={xs[li]} cy={y} r={li === 3 ? 13 : 10} fill="var(--art-bg, transparent)" />
        ))
      )}
      <text x="40" y="374" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">ŷ = σ(Wx + b)</text>
    </Frame>
  );
}

function Cyber() {
  const hex = ["4f 2a 9c e1", "b7 03 5d 8e", "ff 10 c4 2b", "7a 9e 01 d3", "3c 88 af 56", "e0 4b 12 9f", "61 d7 3a c8", "0d f2 77 b4"];
  return (
    <Frame label="A padlock locking while an encrypted hex stream scrolls behind it">
      <clipPath id="hex-clip"><rect x="40" y="40" width="320" height="300" /></clipPath>
      <g clipPath="url(#hex-clip)" opacity={0.6}>
        <g className="a-scroll-up-slow">
          {[...hex, ...hex, ...hex].map((h, i) => (
            <text key={i} x={i % 2 ? 250 : 46} y={60 + i * 24} fontSize="13" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">
              {h}
            </text>
          ))}
        </g>
      </g>
      <path className="a-shackle" d="M160 190 V150 a40 40 0 0 1 80 0 V190" strokeWidth={10} />
      <rect x="135" y="185" width="130" height="115" fill="var(--art-accent)" stroke="currentColor" strokeWidth={2} />
      <circle cx="200" cy="232" r="11" fill="currentColor" />
      <rect x="196" y="236" width="8" height="30" fill="currentColor" stroke="none" />
      <rect className="a-sweep" x="40" y="40" width="320" height="3" fill="var(--art-accent)" stroke="none" />
      <text x="40" y="374" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">sha256 · verified</text>
    </Frame>
  );
}

function IoT() {
  const pins = [0, 1, 2, 3, 4, 5];
  return (
    <Frame label="A microcontroller chip with a sensor broadcasting signal waves">
      <rect x="120" y="140" width="160" height="160" />
      <rect x="150" y="170" width="100" height="100" strokeDasharray="4 4" />
      {pins.map((i) => (
        <g key={i}>
          <line x1={138 + i * 25} y1="140" x2={138 + i * 25} y2="118" />
          <line x1={138 + i * 25} y1="300" x2={138 + i * 25} y2="322" />
          <line x1="120" y1={158 + i * 25} x2="98" y2={158 + i * 25} />
          <line x1="280" y1={158 + i * 25} x2="302" y2={158 + i * 25} />
        </g>
      ))}
      <circle className="a-blink" cx="200" cy="220" r="12" fill="var(--art-accent)" />
      {[0, 1, 2].map((i) => (
        <path key={i} className="a-wave" style={d(i * 0.6)} d="M300 92 a40 40 0 0 1 40 40" transform={`translate(${i * 14} ${-i * 14})`} />
      ))}
      <circle cx="300" cy="132" r="5" fill="currentColor" />
      <polyline className="a-draw" points="40,360 80,360 95,335 110,380 125,345 140,360 360,360" strokeWidth={2} pathLength={100} />
    </Frame>
  );
}

function CP() {
  const nodes: [number, number][] = [
    [200, 70], [120, 150], [280, 150], [80, 230], [160, 230], [240, 230], [320, 230], [60, 310], [100, 310], [300, 310], [340, 310],
  ];
  const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [3, 7], [3, 8], [6, 9], [6, 10]];
  const order = [0, 1, 3, 7, 8, 4, 2, 5, 6, 9, 10];
  return (
    <Frame label="A binary tree being traversed node by node">
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="17" fill="var(--art-bg, transparent)" />
          <circle className="a-visit" style={d(order.indexOf(i) * 0.28)} cx={x} cy={y} r="17" fill="var(--art-accent)" stroke="currentColor" />
          <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">
            {order.indexOf(i) + 1}
          </text>
        </g>
      ))}
      <text x="40" y="374" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">dfs(root) · O(n)</text>
    </Frame>
  );
}

function Graphic() {
  return (
    <Frame label="A bezier curve being drawn with its handles and a colour palette">
      <path className="a-draw" d="M60 290 C 120 80, 220 80, 230 200 S 330 330, 350 120" strokeWidth={4} pathLength={100} />
      <line x1="60" y1="290" x2="120" y2="80" strokeDasharray="3 4" />
      <line x1="230" y1="200" x2="220" y2="80" strokeDasharray="3 4" />
      <line x1="230" y1="200" x2="240" y2="320" strokeDasharray="3 4" />
      <line x1="350" y1="120" x2="330" y2="330" strokeDasharray="3 4" />
      {[[60, 290], [230, 200], [350, 120]].map(([x, y], i) => (
        <rect key={i} x={x - 6} y={y - 6} width="12" height="12" fill="var(--art-bg, transparent)" />
      ))}
      {[[120, 80], [220, 80], [240, 320], [330, 330]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="currentColor" />
      ))}
      <g transform="translate(40 340)">
        <rect className="a-pop" style={d(0.2)} width="34" height="22" fill="var(--art-accent)" />
        <rect className="a-pop" style={d(0.35)} x="44" width="34" height="22" fill="currentColor" />
        <rect className="a-pop" style={d(0.5)} x="88" width="34" height="22" />
      </g>
    </Frame>
  );
}

function Video() {
  return (
    <Frame label="An editing timeline with clips on tracks and a moving playhead">
      <rect x="40" y="50" width="320" height="130" />
      <polygon points="185,95 185,135 222,115" fill="var(--art-accent)" stroke="currentColor" />
      {[0, 1, 2].map((t) => (
        <line key={t} x1="40" y1={214 + t * 40} x2="360" y2={214 + t * 40} strokeWidth={0.75} opacity={0.6} />
      ))}
      <rect x="44" y="200" width="110" height="28" fill="var(--art-accent)" stroke="none" />
      <rect x="160" y="200" width="70" height="28" />
      <rect x="236" y="200" width="120" height="28" fill="var(--art-accent)" stroke="none" />
      <rect x="80" y="240" width="160" height="28" />
      <rect x="250" y="240" width="60" height="28" />
      <path d="M44 296 q8 -14 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" />
      <g className="a-playhead">
        <line x1="44" y1="190" x2="44" y2="320" stroke="var(--art-accent)" strokeWidth={2.5} />
        <polygon points="36,186 52,186 44,196" fill="var(--art-accent)" stroke="none" />
      </g>
      <text x="40" y="374" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">00:01:24:12</text>
    </Frame>
  );
}

function Writing() {
  const widths = [250, 280, 210, 270, 160];
  return (
    <Frame label="A page of text being written line by line">
      <rect x="70" y="40" width="260" height="320" />
      <text x="90" y="110" fontSize="64" fill="var(--art-accent)" stroke="none" fontFamily="var(--font-sans)" fontWeight={800}>“</text>
      <rect className="a-pop" style={d(0.1)} x="90" y="122" width="150" height="16" fill="currentColor" stroke="none" />
      {widths.map((w, i) => (
        <line key={i} className="a-grow" style={d(0.4 + i * 0.35)} x1="90" y1={170 + i * 26} x2={90 + (w * 220) / 280} y2={170 + i * 26} strokeWidth={6} />
      ))}
      <rect className="a-caret" x={90 + (160 * 220) / 280 + 6} y="266" width="3" height="20" fill="var(--art-accent)" stroke="none" />
      <line x1="90" y1="320" x2="160" y2="320" />
      <text x="40" y="384" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">draft 03 · 412 words</text>
    </Frame>
  );
}

function OpCon() {
  const bars: [number, number, number][] = [
    [0, 40, 110], [1, 120, 90], [2, 90, 150], [3, 210, 100], [4, 170, 140], [5, 260, 70],
  ];
  return (
    <Frame label="An event schedule with tasks filling in on a timeline">
      {[0, 1, 2, 3, 4, 5, 6].map((c) => (
        <line key={c} x1={60 + c * 50} y1="60" x2={60 + c * 50} y2="330" strokeWidth={0.75} opacity={0.5} />
      ))}
      {["M", "T", "W", "T", "F", "S", "S"].map((l, c) => (
        <text key={c} x={78 + c * 50} y="52" fontSize="12" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">{l}</text>
      ))}
      {bars.map(([row, x, w], i) => (
        <rect key={i} className="a-grow" style={d(0.2 + i * 0.25)} x={60 + x * 0.9} y={80 + row * 40} width={w} height="22" fill={i % 2 ? "var(--art-accent)" : "none"} />
      ))}
      <line className="a-today" x1="235" y1="66" x2="235" y2="330" stroke="var(--art-accent)" strokeWidth={2.5} />
      <path className="a-pop" style={d(1.8)} d="M300 345 l10 10 l20 -22" strokeWidth={3} />
      <text x="40" y="374" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">run-of-show · on time</text>
    </Frame>
  );
}

function Networks() {
  const n: [number, number][] = [[80, 110], [200, 70], [320, 120], [130, 220], [270, 230], [70, 320], [200, 310], [330, 320]];
  const e: [number, number][] = [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4], [3, 5], [3, 6], [4, 6], [4, 7], [6, 7], [5, 6]];
  const packets = [0, 4, 6, 10, 12, 8];
  return (
    <Frame label="A network topology with packets moving between nodes">
      {e.map(([a, b], i) => (
        <line key={i} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} />
      ))}
      {packets.map((ei, k) => {
        const [a, b] = e[ei];
        return (
          <line key={k} className="a-signal" style={d(k * 0.3)} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} stroke="var(--art-accent)" strokeWidth={5} pathLength={100} />
        );
      })}
      {n.map(([x, y], i) => (
        <g key={i}>
          <circle className="a-ring" style={d(i * 0.25)} cx={x} cy={y} r="22" strokeWidth={1} />
          <rect x={x - 12} y={y - 12} width="24" height="24" fill="var(--art-bg, transparent)" />
          <rect x={x - 5} y={y - 5} width="10" height="10" fill="currentColor" stroke="none" />
        </g>
      ))}
      <text x="40" y="374" fontSize="14" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">10.0.0.0/24 · 8 hosts up</text>
    </Frame>
  );
}

const ART: Record<string, ComponentType> = {
  "Web Development": WebDev,
  "App Development": AppDev,
  "AI ML": AIML,
  Cybersecurity: Cyber,
  "IOT & Embedded Systems": IoT,
  "Competitive Programming": CP,
  "Graphic Designing": Graphic,
  "Video Editing": Video,
  "Content Writing": Writing,
  "OpCon & PR": OpCon,
  Networks: Networks,
};

export function ClusterArt({ title, active, className }: { title: string; active?: boolean; className?: string }) {
  const Art = ART[title] ?? Networks;
  return (
    <div className={`art ${className ?? ""}`} data-active={active ? "" : undefined}>
      <Art />
    </div>
  );
}
