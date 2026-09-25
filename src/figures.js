/* Generated line drawings: thousands of circles, segments and arcs whose centres, sizes and angles follow the
   formulas Hamid Naderi Yeganeh published in "Making Mathematical Art" (Scientific American), set in motion and in
   colour. Canvas, crisp at any pixel density. No dependencies. */
(() => {
  'use strict';
  const TAU = Math.PI * 2, PI = Math.PI;
  const { sin, cos, pow, min, max, hypot } = Math;
  const sq = (v) => v * v;
  const ease = (v) => 1 - pow(1 - v, 3);
  const media = (q) => window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} };
  const motionOK = !media('(prefers-reduced-motion: reduce)').matches;
  const finePointer = media('(hover: hover) and (pointer: fine)').matches;

  const portrait = window.TYB_PORTRAIT;
  const tone = (u, v) => {
    const i = min(portrait.h - 1, max(0, Math.floor(v * portrait.h))) * portrait.w + min(portrait.w - 1, max(0, Math.floor(u * portrait.w)));
    const d = parseInt(portrait.dark[i], 16) / 15;
    return [colors.dark ? 1 - d : d];
  };

  // Each form draws n elements; for element k, s = k / n runs 0..1 exactly as in the published formulas.
  // t is a slow clock that turns the inner terms so the figure keeps flowing; m is the eased pointer offset (-1..1).
  // hue(s, t) picks one of the palette colours, so colour bands travel slowly along the figure.
  const P = 8;
  const bands = (s, t, k) => Math.floor(((s * k + t * .12) % 1 + 1) % 1 * P);
  // The portrait stays in ink; a band a third as wide as the picture carries the palette across every line together.
  const band = (w) => { const k = ((w % 1) + 1) % 1; return k < .36 ? Math.floor(k / .36 * P) : P; };
  const circles = (N, a, b, c, d, pow6, bY) => ({ n: N, fit: .86, lw: .42,
    el: (s, t, m) => {
      const lift = c + m.y * .08, turn = a * PI * s + m.x * .3;
      const kx = 1 - lift * sq(cos(b * PI * s + t)), ky = 1 - lift * sq(cos((bY || b) * PI * s + t));
      return ['c', cos(turn) * kx, sin(turn) * ky, 1 / 200 + pow(sin(d * PI * s + t * .5), pow6) / 10];
    },
    hue: (s, t) => bands(s, t, a / 2) });
  const FORMS = {
    // 14,000 circles: X = cos(10πs)(1 − ½cos²(16πs)), R = 1/200 + sin⁴(52πs)/10
    circles14: circles(14000, 10, 16, .5, 52, 4),
    // 12,000 circles: X = cos(14πs)(1 − ¾cos²(32πs)), R = 1/200 + sin⁶(56πs)/10
    circles12: circles(12000, 14, 32, .75, 56, 6),
    // 10,000 circles: X = cos(14πs)(1 − ¾cos²(20πs)), Y = sin(14πs)(1 − ¾cos²(24πs))
    circles10: circles(10000, 14, 20, .75, 54, 6, 24),
    // 9,000 circles: X = cos(14πs)(1 − ¾cos²(36πs)), R = 1/200 + sin⁶(64πs)/10
    circles9: circles(9000, 14, 36, .75, 64, 6),
    // 8,000 segments from (A, B) to (C, D)
    segments8: { n: 8000, fit: .5, lw: .32,
      el: (s, t, m) => {
        const u = sq(sin(12 * PI * s + t)) + sq(sin(18 * PI * s)), v = sq(sin(8 * PI * s)) + sq(sin(10 * PI * s + t));
        const a = 14 * PI * s + m.x * .3;
        return ['l', sin(a) * u, cos(a) * u, sin(a) * v, cos(a) * v];
      },
      hue: (s, t) => bands(s, t, 7) },
    // 4,000 segments: the same bloom turned 14 and 30 times
    segments4: { n: 4000, fit: .5, lw: .36,
      el: (s, t, m) => {
        const u = sq(sin(16 * PI * s + t)) + sq(sin(14 * PI * s)), a = 14 * PI * s + m.x * .3, b = 30 * PI * s + m.x * .3 + m.y * .2;
        return ['l', sin(a) * u, cos(a) * u, sin(b) * u, cos(b) * u];
      },
      hue: (s, t) => bands(s, t, 7) },
    // 8,000 arcs: centre (X, Y), radius S, from angle B through C to A
    arcs8: { n: 8000, fit: .5, lw: .34,
      el: (s, t, m) => {
        const q = 32 * PI * s + t, c = -86 * PI * s + m.x * .5, open = PI / 20 + 7 * PI / 8 * pow(cos(q), 4);
        const k = 1 - cos(24 * PI * s) / 2 - pow(cos(q), 3) / 4 + pow(cos(48 * PI * s), 3) / 4;
        return ['a', .75 * cos(2 * PI * s) * k, .75 * sin(2 * PI * s) * k, 1 / 8 + 5 / 8 * pow(sin(q), 4), c - open, c + open];
      },
      hue: (s, t) => bands(s, t, 4) },
    // 7,000 arcs
    arcs7: { n: 7000, fit: .46, lw: .34,
      el: (s, t, m) => {
        const q = 32 * PI * s + t, c = -86 * PI * s + m.x * .5, open = PI / 20 + 7 * PI / 8 * pow(cos(q), 4);
        const k = 1 - cos(q) / 2 - pow(cos(40 * PI * s), 3) / 4 + pow(cos(48 * PI * s), 3) / 4;
        return ['a', .875 * cos(2 * PI * s) * k, .875 * sin(2 * PI * s) * k, 1 / 8 + .75 * pow(sin(q), 4), c - open, c + open];
      },
      hue: (s, t) => bands(s, t, 4) },
    // A line portrait from a 68x110 darkness map of the author's photo (src/portrait.json).
    // The waves breathe and a band of colour sweeps across every line at once. The pointer, anywhere on the page, steers them.
    portraitLines: { lw: .55, custom: (f, groups) => {
      const rows = 104, gap = f.h / rows, step = max(.7, f.w / 300), shown = Math.ceil(rows * ease(f.drawn));
      const breath = .78 + .22 * sin(f.t * 6), tilt = f.m.y * 7, steer = f.m.x * 2.5, sweep = f.t * 1.6 + f.m.x * .5;
      for (let j = 0; j < shown; j++) {
        const v = (j + .5) / rows, y0 = v * f.h, pulse = .75 + .5 * pow(max(0, sin(v * 5 - f.t * 5)), 3);
        let phase = j * 1.3 + v * tilt, last = -1, px = 0, py = y0;
        for (let x = 0; x <= f.w; x += step) {
          const u = x / f.w, [tone0] = tone(u, v), d = pow(tone0, 1.25);
          phase += (.1 + d * 1.1) * step / .8;
          const y = y0 + sin(phase + f.t * 3 + steer) * d * gap * .95 * breath * pulse;
          const g = band(u * .8 + v * .45 - sweep);
          if (last < 0) groups[g].moveTo(x, y);
          else { if (g !== last) groups[g].moveTo(px, py); groups[g].lineTo(x, y); }
          last = g; px = x; py = y;
        }
      }
    } },
    portraitRings: { lw: .6, custom: (f, groups) => {
      const step = f.w / 48, rowStep = step * .866, rows = Math.ceil(f.h / rowStep), shown = Math.ceil(rows * ease(f.drawn));
      const ox = f.w * (.5 + f.m.x * .4), oy = f.h * (.5 + f.m.y * .4), wave = TAU / (f.w * .35);
      for (let row = 0; row < shown; row++) {
        const y = step / 2 + row * rowStep;
        for (let x = row % 2 ? step / 2 : 0; x < f.w; x += step) {
          const [tone0] = tone(x / f.w, y / f.h), dist = hypot(x - ox, y - oy);
          const r = pow(tone0, 1.2) * step * .62 * (.84 + .16 * sin(f.t * 6 - dist * wave));
          if (r < .35) continue;
          const g = band(dist / f.w * .9 - f.t * 1.6);
          groups[g].moveTo(x + r, y);
          groups[g].arc(x, y, r, 0, TAU);
        }
      }
    } },
  };
  const FIGURES = {
    opening: ['circles14', 'segments8', 'arcs8', 'circles12'],
    poetry: ['circles9', 'circles14'],
    stories: ['circles12', 'arcs7'],
    essays: ['segments4', 'segments8'],
    selected: ['arcs7', 'circles10'],
    video: ['circles10', 'arcs8'],
    portrait: ['portraitLines', 'portraitRings'],
  };

  // Eight colours that sit on white without shouting, and brighter ones for the dark page.
  const PALETTES = {
    light: ['#2f6f6a', '#7a9a3a', '#c9a227', '#b5562e', '#8e3b62', '#6a4c93', '#3d5a80', '#2a9d8f'],
    dark: ['#56e0cf', '#b5d86a', '#ffd166', '#f08a5d', '#e07ab8', '#b28dff', '#8fb3ff', '#5fd3c6'],
  };
  let colors = { ink: '#080808', dark: false, palette: PALETTES.light };
  const readColors = () => {
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || colors.ink;
    const dark = parseInt(ink.replace('#', '').slice(0, 2), 16) > 128;
    colors = { ink, dark, palette: dark ? PALETTES.dark : PALETTES.light };
  };

  // Fewer elements on small frames: the same formula with a smaller n keeps its shape, only lighter.
  const budget = (form, f) => form.custom ? 1 : min(form.n, Math.round(form.n * min(1, max(.22, min(f.w, f.h) / 620))));
  const paint = (f, formName, alpha) => {
    const form = FORMS[formName];
    const { ctx, w, h } = f;
    const groups = Array.from({ length: P + 1 }, () => new Path2D());
    if (form.custom) form.custom(f, groups);
    else {
      const n = budget(form, f), count = Math.ceil(n * ease(f.drawn));
      const scale = min(w, h) / 2 * form.fit, cx = w / 2, cy = h / 2;
      for (let k = 0; k < count; k++) {
        const s = k / n, e = form.el(s, f.t, f.m), path = groups[form.hue(s, f.t)];
        if (e[0] === 'c') { const x = cx + e[1] * scale, y = cy - e[2] * scale, r = max(.4, e[3] * scale); path.moveTo(x + r, y); path.arc(x, y, r, 0, TAU); }
        else if (e[0] === 'l') { path.moveTo(cx + e[1] * scale, cy - e[2] * scale); path.lineTo(cx + e[3] * scale, cy - e[4] * scale); }
        else {
          // Canvas angles run clockwise with y down; mirror the arc so it matches the formula's orientation.
          const x = cx + e[1] * scale, y = cy - e[2] * scale, r = e[3] * scale;
          path.moveTo(x + r * cos(-e[5]), y + r * sin(-e[5]));
          path.arc(x, y, r, -e[5], -e[4]);
        }
      }
    }
    ctx.globalAlpha = alpha * (form.custom ? 1 : colors.dark ? .9 : .82);
    groups.forEach((path, g) => {
      ctx.strokeStyle = g < P ? colors.palette[g] : colors.ink;
      ctx.lineWidth = (form.lw || .5) * (form.custom && g < P ? 1.7 : 1);
      ctx.stroke(path);
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
        again = true;
        // Drifting alone needs no more than ~30 frames a second; the draw-in and morph stay at full rate.
        if (time - (f.painted || 0) > 31) changed = true;
      }
      if (changed) { f.painted = time; render(f); }
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
    if (!forms || (el.dataset.figure === 'portrait' && !portrait)) return;
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
