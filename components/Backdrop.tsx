/* Fond : un quartier vu du ciel. Des trajets rouges convergent vers le commerce du partenaire —
   « des clients du quartier, livrés chez vous ». Généré avec une graine fixe : même rendu serveur/client. */

const W = 1600, H = 1000, CX = W / 2, CY = H / 2;
const ROT = -9, SCALE = 1.22;
const PIN_TARGET: [number, number] = [1090, 620]; // le commerce : derrière la carte du formulaire (desktop)

function rng(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** Ramène un point écran dans le repère de la grille (inverse de la rotation + échelle). */
function toGrid([x, y]: [number, number]): [number, number] {
  const a = (-ROT * Math.PI) / 180;
  const dx = (x - CX) / SCALE, dy = (y - CY) / SCALE;
  return [CX + dx * Math.cos(a) - dy * Math.sin(a), CY + dx * Math.sin(a) + dy * Math.cos(a)];
}

function build() {
  const r = rng(20260928);
  const xs: number[] = [], ys: number[] = [];
  for (let x = -120; x < W + 120; x += 42 + r() * 46) xs.push(Math.round(x));
  for (let y = -120; y < H + 120; y += 38 + r() * 40) ys.push(Math.round(y));

  // rues : chaque tronçon entre deux croisements a une chance d'être absent (culs-de-sac, parcs)
  const streets: string[] = [];
  const run = (fixed: number, stops: number[], vertical: boolean) => {
    let start: number | null = null;
    for (let i = 0; i < stops.length - 1; i++) {
      const keep = r() > 0.16;
      if (keep && start === null) start = stops[i];
      if ((!keep || i === stops.length - 2) && start !== null) {
        const end = keep ? stops[i + 1] : stops[i];
        if (end > start) streets.push(vertical ? `M${fixed} ${start}V${end}` : `M${start} ${fixed}H${end}`);
        start = null;
      }
    }
  };
  xs.forEach(x => run(x, ys, true));
  ys.forEach(y => run(y, xs, false));

  const avenues = [
    `M${xs[7]} ${ys[0]}V${ys[ys.length - 1]}`,
    `M${xs[24]} ${ys[0]}V${ys[ys.length - 1]}`,
    `M${xs[0]} ${ys[14]}H${xs[xs.length - 1]}`,
    `M${xs[0]} ${ys[6]}H${xs[xs.length - 1]}`,
  ];

  // le commerce : croisement le plus proche de la cible
  const [gx, gy] = toGrid(PIN_TARGET);
  const nearest = (arr: number[], v: number) => arr.reduce((b, n, i) => (Math.abs(n - v) < Math.abs(arr[b] - v) ? i : b), 0);
  const pi = nearest(xs, gx), pj = nearest(ys, gy);
  const at = (di: number, dj: number): [number, number] => [
    xs[Math.max(0, Math.min(xs.length - 1, pi + di))],
    ys[Math.max(0, Math.min(ys.length - 1, pj + dj))],
  ];

  // trajets à angle droit, le long des rues, qui finissent tous au commerce
  const plans: [number, number][][] = [
    [[-6, -5], [-6, -2], [-3, -2], [-3, 0], [0, 0]],
    [[8, -6], [8, -3], [0, -3], [0, 0]],
    [[-7, 3], [-2, 3], [-2, 0], [0, 0]],
    [[6, 4], [6, 1], [1, 1], [1, 0], [0, 0]],
    [[3, -8], [3, -5], [-1, -5], [-1, -1], [0, -1], [0, 0]],
  ];
  const routes = plans.map((plan, k) => {
    const pts = plan.map(([i, j]) => at(i * 2, j * 2));
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
    return { d: 'M' + pts.map(p => p.join(' ')).join('L'), start: pts[0], len: Math.round(len), dur: 5 + k * 1.1, delay: k * 1.3 };
  });

  return { streets: streets.join(''), avenues: avenues.join(''), routes, pin: at(0, 0) };
}

const MAP = build();

export default function Backdrop() {
  const { streets, avenues, routes, pin } = MAP;
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="bd-glow" />
      <svg className="bd-map" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMax slice">
        <g transform={`translate(${CX} ${CY}) rotate(${ROT}) scale(${SCALE}) translate(${-CX} ${-CY})`}>
          <path d={streets} className="bd-street" />
          <path d={avenues} className="bd-avenue" />
          <path d="M-200 900C300 760 640 1010 1000 820S1500 600 1800 660" className="bd-hwy" />
          <path d="M-200 900C300 760 640 1010 1000 820S1500 600 1800 660" className="bd-hwy-line" />

          {routes.map((rt, i) => (
            <g key={i}>
              <path d={rt.d} className="bd-route" />
              <path d={rt.d} className="bd-car"
                style={{ '--len': `${rt.len}px`, animationDuration: `${rt.dur}s`, animationDelay: `${rt.delay}s` } as React.CSSProperties} />
              <circle cx={rt.start[0]} cy={rt.start[1]} r="3.5" className="bd-client" />
              <circle cx={rt.start[0]} cy={rt.start[1]} r="3.5" className="bd-client-ring" style={{ animationDelay: `${rt.delay}s` }} />
            </g>
          ))}

          <g transform={`translate(${pin[0]} ${pin[1]}) rotate(${-ROT})`}>
            <circle r="14" className="bd-pin-ring" />
            <circle r="14" className="bd-pin-ring" style={{ animationDelay: '1.2s' }} />
            <circle r="110" className="bd-pin-halo" />
            <path d="M0-40C-11-40-20-31-20-20-20-5 0 0 0 0S20-5 20-20C20-31 11-40 0-40Z" className="bd-pin" />
            <circle cy="-20.5" r="7" fill="#0B0B0A" />
          </g>
        </g>
      </svg>
      <div className="bd-grain" />
    </div>
  );
}
