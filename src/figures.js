/* Generated line drawings: families of simple shapes whose centres, sizes and turns follow small formulas,
   after Hamid Naderi Yeganeh's mathematical art. Canvas, crisp at any pixel density. No dependencies. */
(() => {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const { sin, cos, pow, atan2, min, max } = Math;
  const sq = (v) => v * v;
  const smooth = (v) => { const c = min(1, max(0, v)); return c * c * (3 - 2 * c); };
  const ease = (v) => 1 - pow(1 - v, 3);
  const media = (q) => window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} };
  const motionOK = !media('(prefers-reduced-motion: reduce)').matches;
  const finePointer = media('(hover: hover) and (pointer: fine)').matches;

  // Each form: n shapes; at(s, t, m) gives [x, y, size, turn] inside a -1..1 square for s in 0..1.
  // t is a slow clock that keeps the lines drifting; m is the eased pointer offset (-1..1).
  // accent(s, t) marks the shapes drawn in yellow.
  const lens = (s, t, m, lobes, beat, pull) => {
    const a = lobes * PI * s + m.x * .35;
    const w = 1 - (pull + m.y * .12) * sq(cos(beat * PI * s + t));
    return [cos(a) * w, sin(a) * w];
  };
  const drift = (u, t, m, reach) => {
    const ax = max(-1, min(1, cos(t * .25) * .35 + m.x * .9));
    const ay = max(-1, min(1, sin(t * .25) * .35 + m.y * .9));
    return [ax * reach, ay * reach];
  };
  const FORMS = {
    petals: { n: 900, shape: 'circle', lw: .45,
      at: (s, t, m) => [...lens(s, t, m, 6, 16, .72), .02 + .11 * pow(sin(24 * PI * s), 6), 0],
      accent: (s) => sq(sin(24 * PI * s)) > .975 },
    bloom: { n: 700, shape: 'circle', lw: .45,
      at: (s, t, m) => [...lens(s, t, m, 4, 10, .6), .03 + .14 * pow(sin(16 * PI * s), 4), 0],
      accent: (s) => sq(sin(16 * PI * s)) > .96 },
    pixels: { n: 1800, shape: 'pixel',
      at: (s, t, m) => [...lens(s, t, m, 6, 16, .72), 0, 0],
      accent: (s) => sin(6 * PI * s) > .86 },
    bottle: { n: 34, shape: 'circle', lw: .7,
      at: (s, t, m) => {
        const u = s * 34 / 33;
        const r = u < .22 ? .15 : u < .56 ? .15 + .27 * smooth((u - .22) / .34) : .42 - .05 * sq(max(0, (u - .86) / .14));
        return [(m.x * .14 + sin(t * .8 + u * 2.4) * .025) * u, -.78 + u * 1.28 + m.y * .03 * u, r, 0];
      },
      accent: (s) => s > .62 },
    rings: { n: 150, shape: 'circle', lw: .55,
      at: (s, t, m) => { const a = TAU * s + m.x * .4; return [.52 * cos(a), .52 * sin(a), .26 + .18 * sin(5 * a + t), 0]; },
      accent: (s, t) => sin(5 * (TAU * s) + t) > .92 },
    tunnel: { n: 22, shape: 'circle', lw: .7,
      at: (s, t, m) => {
        const u = s * 22 / 21, r = .95 - .8 * pow(u, .9), [dx, dy] = drift(u, t, m, (.95 - r) * .65);
        return [dx, dy, r, 0];
      },
      accent: (s) => s > .84 },
    lemniscate: { n: 240, shape: 'square', lw: .55,
      at: (s, t, m) => {
        const p = TAU * s, d = 1 + sq(sin(p));
        return [.92 * cos(p) / d, 1.15 * sin(p) * cos(p) / d, .05 + .12 * sq(sin(3 * p + t)), 2 * p + m.x];
      },
      accent: (s, t) => sq(sin(3 * TAU * s + t)) > .93 },
    squareVortex: { n: 40, shape: 'square', lw: .65,
      at: (s, t, m) => { const u = s * 40 / 39, r = .9 * (1 - .88 * u), [dx, dy] = drift(u, t, m, (.9 - r) * .35); return [dx, dy, r, u * 1.6 + t * .12 + m.x * .6]; },
      accent: (s) => s > .82 },
    hexVortex: { n: 44, shape: 'hexagon', lw: .65,
      at: (s, t, m) => { const u = s * 44 / 43, r = .92 * (1 - .9 * u), [dx, dy] = drift(u, t, m, (.92 - r) * .38); return [dx, dy, r, u * 1.1 + t * .1 + m.x * .5]; },
      accent: (s) => s > .84 },
    hexRing: { n: 120, shape: 'hexagon', lw: .55,
      at: (s, t, m) => { const a = TAU * s + m.x * .3, rho = .5 + .08 * sin(3 * a + t); return [rho * cos(a), rho * sin(a), .28 + .1 * sin(6 * a), 2 * a]; },
      accent: (s) => sin(6 * TAU * s) > .93 },
    pentagons: { n: 700, shape: 'pentagon', lw: .45,
      at: (s, t, m) => [...lens(s, t, m, 10, 6, .55), .018 + .075 * pow(sin(30 * PI * s), 4), 10 * PI * s],
      accent: (s) => pow(sin(30 * PI * s), 4) > .82 },
    ellipses: { n: 240, shape: 'ellipse', lw: .55,
      at: (s, t, m) => {
        const p = TAU * s, q = 3 * p + t * .35;
        return [.66 * sin(q), .66 * sin(2 * p), .2, atan2(2 * cos(2 * p), 3 * cos(q)) + m.x * .5];
      },
      accent: (s) => Math.floor(s * 24) % 5 === 0 },
    pixelKnot: { n: 1800, shape: 'pixel',
      at: (s, t, m) => { const p = TAU * s; return [.85 * sin(3 * p + t * .3 + m.x * .4), .85 * sin(4 * p + m.y * .4), 0, 0]; },
      accent: (s) => Math.floor(s * 12) % 4 === 0 },
  };
  const FIGURES = {
    opening: ['petals', 'bottle', 'pixels'],
    bottle: ['bottle', 'petals'],
    poetry: ['bloom', 'rings', 'tunnel'],
    stories: ['lemniscate', 'squareVortex'],
    essays: ['hexVortex', 'hexRing'],
    selected: ['pentagons', 'bottle'],
    video: ['ellipses', 'pixelKnot'],
  };

  const polygon = (ctx, sides, x, y, r, turn) => {
    for (let k = 0; k <= sides; k++) {
      const a = turn + k * TAU / sides - PI / 2;
      if (k) ctx.lineTo(x + r * cos(a), y + r * sin(a)); else ctx.moveTo(x + r * cos(a), y + r * sin(a));
    }
  };
  const trace = (ctx, shape, x, y, r, turn) => {
    if (shape === 'circle') { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
    else if (shape === 'square') polygon(ctx, 4, x, y, r, turn + PI / 4);
    else if (shape === 'pentagon') polygon(ctx, 5, x, y, r, turn);
    else if (shape === 'hexagon') polygon(ctx, 6, x, y, r, turn);
    else if (shape === 'ellipse') { ctx.moveTo(x + r * cos(turn), y + r * sin(turn)); ctx.ellipse(x, y, r, r * .36, turn, 0, TAU); }
  };

  let colors = { ink: '#080808', accent: '#e8b400' };
  const readColors = () => {
    const style = getComputedStyle(document.documentElement);
    colors = { ink: style.getPropertyValue('--ink').trim() || colors.ink, accent: style.getPropertyValue('--accent').trim() || colors.accent };
  };

  const paint = (f, formName, alpha) => {
    const form = FORMS[formName];
    const { ctx, w, h } = f;
    const scale = min(w, h) / 2 * .8, cx = w / 2, cy = h / 2;
    const count = Math.ceil(form.n * ease(f.drawn));
    const cell = max(1.5, scale / 90);
    const groups = [new Path2D(), new Path2D()];
    for (let i = 0; i < count; i++) {
      const s = i / form.n;
      const [x, y, r, turn] = form.at(s, f.t, f.m);
      const g = form.accent(s, f.t) ? 1 : 0;
      const px = cx + x * scale, py = cy + y * scale;
      if (form.shape === 'pixel') groups[g].rect(Math.round(px / cell) * cell, Math.round(py / cell) * cell, cell * .82, cell * .82);
      else trace(groups[g], form.shape, px, py, max(.5, r * scale), turn);
    }
    ctx.globalAlpha = alpha;
    groups.forEach((path, g) => {
      const color = g ? colors.accent : colors.ink;
      if (form.shape === 'pixel') { ctx.fillStyle = color; ctx.fill(path); }
      else { ctx.strokeStyle = color; ctx.lineWidth = (form.lw || .5) * (g ? 1.3 : 1); ctx.stroke(path); }
    });
    ctx.globalAlpha = 1;
  };
  const render = (f) => {
    const { ctx, dpr } = f;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, f.w, f.h);
    const now = f.forms[f.index];
    if (f.morph < 1 && f.previous) { paint(f, f.previous, 1 - ease(f.morph)); paint(f, now, ease(f.morph)); }
    else paint(f, now, 1);
  };

  const frames = [];
  let raf = 0, last = 0, pointer = null;
  const tick = (time) => {
    raf = 0;
    const dt = min(.05, (time - last) / 1000 || 0);
    last = time;
    let again = false;
    frames.forEach((f) => {
      if (!f.visible || !f.w) return;
      let changed = f.dirty;
      f.dirty = false;
      if (f.drawn < 1) { f.drawn = min(1, f.drawn + dt / 2.4); changed = true; }
      if (f.morph < 1) { f.morph = min(1, f.morph + dt / 1.1); changed = true; }
      if (motionOK) {
        f.t += dt * .16;
        let goal = { x: 0, y: 0 };
        if (pointer) {
          const box = f.el.getBoundingClientRect();
          goal = { x: max(-1, min(1, (pointer.x - box.left - box.width / 2) / (box.width * .75))), y: max(-1, min(1, (pointer.y - box.top - box.height / 2) / (box.height * .75))) };
        }
        f.m = { x: f.m.x + (goal.x - f.m.x) * .05, y: f.m.y + (goal.y - f.m.y) * .05 };
        changed = true;
        again = true;
      }
      if (changed) render(f);
      if (f.drawn < 1 || f.morph < 1) again = true;
    });
    if (again) raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  const sizer = 'ResizeObserver' in window ? new ResizeObserver((entries) => entries.forEach((entry) => {
    const f = frames.find((item) => item.el === entry.target);
    const box = entry.contentRect;
    f.dpr = min(window.devicePixelRatio || 1, 3);
    f.w = box.width; f.h = box.height;
    f.canvas.width = Math.round(box.width * f.dpr);
    f.canvas.height = Math.round(box.height * f.dpr);
    f.dirty = true;
    wake();
  })) : null;
  const watcher = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((entry) => {
    const f = frames.find((item) => item.el === entry.target);
    f.visible = entry.isIntersecting;
    if (f.visible) { f.drawn = motionOK ? 0 : 1; f.dirty = true; wake(); }
  }), { threshold: .02 }) : null;
  if (!sizer || !watcher || !window.Path2D) return;

  document.querySelectorAll('.figure-frame[data-figure]').forEach((el) => {
    const forms = FIGURES[el.dataset.figure];
    if (!forms) return;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    el.replaceChildren(canvas);
    el.classList.add('is-live');
    const f = { el, canvas, ctx: canvas.getContext('2d'), forms, index: Number(el.dataset.start) || 0, previous: null, morph: 1, drawn: 0, t: Math.random() * 6, m: { x: 0, y: 0 }, w: 0, h: 0, dpr: 1, visible: false, dirty: true };
    frames.push(f);
    (el.closest('[data-art]') || el).addEventListener('click', () => {
      f.previous = f.forms[f.index];
      f.index = (f.index + 1) % f.forms.length;
      f.morph = motionOK ? 0 : 1;
      f.dirty = true;
      wake();
    });
    sizer.observe(el);
    watcher.observe(el);
  });

  readColors();
  new MutationObserver(() => { readColors(); frames.forEach((f) => { f.dirty = true; }); wake(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  media('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); frames.forEach((f) => { f.dirty = true; }); wake(); });
  if (motionOK && finePointer) {
    document.addEventListener('pointermove', (event) => { pointer = { x: event.clientX, y: event.clientY }; }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { pointer = null; });
  }
})();
