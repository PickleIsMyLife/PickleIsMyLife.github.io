{
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const slides = $$('.slide');
const N = slides.length;
let cur = -1;

/* letters of the big titles */
for (const el of $$('[data-split]')) {
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  let i = 0;
  const out = [];
  el.childNodes.forEach(n => {
    if (n.nodeType === 3) {
      n.textContent.split(/\s+/).filter(Boolean).forEach((word, wi, arr) => {
        out.push('<span class="w">' + Array.from(word).map(c => '<span class="ch" aria-hidden="true"><i style="--i:' + (i++) + '">' + c + '</i></span>').join('') + '</span>');
        if (wi < arr.length - 1) out.push(' ');
      });
    } else if (n.nodeName === 'BR') out.push('<br>');
  });
  el.setAttribute('aria-label', label);
  el.innerHTML = out.join('');
}

/* navigation: dots, counter, progress */
const dots = $('.dots');
dots.innerHTML = slides.map((s, i) => '<button type="button" data-i="' + i + '" aria-label="' + s.dataset.title + '"><span>' + s.dataset.title + '</span></button>').join('');
const dotBtns = $$('button', dots);
const bar = $('.bar i');
const cnt = $('.cnt');
const behavior = reduce ? 'auto' : 'smooth';

function go(i) {
  i = Math.max(0, Math.min(N - 1, i));
  slides[i].scrollIntoView({ behavior, block: 'start' });
}
function step(dir) {
  const s = slides[Math.max(cur, 0)];
  const r = s.getBoundingClientRect();
  const vh = window.innerHeight;
  if (dir > 0 && r.bottom > vh + 40) { window.scrollBy({ top: Math.min(vh * 0.85, r.bottom - vh), behavior }); return; }
  if (dir < 0 && r.top < -40) { window.scrollBy({ top: Math.max(-vh * 0.85, r.top), behavior }); return; }
  go(Math.max(cur, 0) + dir);
}
function setCur(i) {
  if (i === cur || i < 0) return;
  cur = i;
  dotBtns.forEach((b, k) => b.classList.toggle('cur', k === i));
  bar.style.width = (N > 1 ? (i / (N - 1)) * 100 : 100) + '%';
  cnt.textContent = (i + 1) + ' / ' + N;
  document.body.classList.toggle('dark', slides[i].hasAttribute('data-dark'));
  try { history.replaceState(null, '', '#' + slides[i].id); } catch (e) { /* ignore */ }
}
dots.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(+b.dataset.i); });
$('.prev').addEventListener('click', () => step(-1));
$('.next').addEventListener('click', () => step(1));
for (const b of $$('[data-go]')) b.addEventListener('click', () => go(+b.dataset.go));

function toggleFS() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  } catch (e) { /* ignore */ }
}
$('.fs').addEventListener('click', toggleFS);

window.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target;
  if (t.closest && t.closest('input,textarea,select,[contenteditable="true"]')) return;
  const k = e.key;
  if (k === ' ' && t.closest && t.closest('button,a,summary')) return;
  if (k === 'ArrowDown' || k === 'PageDown' || k === 'ArrowRight' || k === ' ') { e.preventDefault(); step(1); }
  else if (k === 'ArrowUp' || k === 'PageUp' || k === 'ArrowLeft') { e.preventDefault(); step(-1); }
  else if (k === 'Home') { e.preventDefault(); go(0); }
  else if (k === 'End') { e.preventDefault(); go(N - 1); }
  else if (k === 'f' || k === 'F') { toggleFS(); }
});

/* hero parallax */
for (const h of $$('.hero')) {
  h.addEventListener('pointermove', e => {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = h.getBoundingClientRect();
    h.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    h.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  });
}

/* counters */
const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const fmt = (v, dec) => {
  const a = Math.abs(v).toFixed(dec).split('.');
  return (v < 0 ? '−' : '') + group(a[0]) + (a[1] ? ',' + a[1] : '');
};
const counters = $$('.count');
const cText = (el, v) => (el.dataset.pre || '') + fmt(v, +(el.dataset.dec || 0)) + (el.dataset.suf || '');
function count(el) {
  const to = parseFloat(el.dataset.to);
  cancelAnimationFrame(el._raf);
  if (reduce) { el.textContent = cText(el, to); return; }
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min(1, Math.max(0, (now - t0 - 350) / 1600));
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = cText(el, to * e);
    if (p < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}
counters.forEach(el => { el.textContent = cText(el, 0); });

/* waving flag */
const flag = $('.flag');
if (flag) {
  const n = 60;
  flag.style.setProperty('--n', n);
  flag.innerHTML = Array.from({ length: n }, (_, k) => '<i style="--k:' + k + '"></i>').join('');
  const srcs = [flag.dataset.src, flag.dataset.orig].filter(Boolean);
  const tryLoad = k => {
    if (k >= srcs.length) { flag.classList.add('noimg'); return; }
    const im = new Image();
    im.onload = () => flag.style.setProperty('--flag', 'url("' + srcs[k] + '")');
    im.onerror = () => tryLoad(k + 1);
    im.src = srcs[k];
  };
  tryLoad(0);
}

/* density squares */
for (const sq of $$('.sq')) {
  const n = +sq.dataset.dots;
  if (sq.classList.contains('kz')) {
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    sq.innerHTML = Array.from({ length: n }, (_, i) => '<i style="--i:' + i + ';--x:' + (12 + rnd() * 70).toFixed(1) + '%;--y:' + (12 + rnd() * 70).toFixed(1) + '%"></i>').join('');
  } else {
    sq.innerHTML = Array.from({ length: n }, (_, i) => '<i style="--i:' + i + '"></i>').join('');
  }
}

/* flip cards */
for (const f of $$('.flip')) {
  f.addEventListener('click', () => {
    f.classList.toggle('open');
    f.setAttribute('aria-pressed', f.classList.contains('open') ? 'true' : 'false');
  });
}

/* globe: from Italy to Kazakhstan */
function makeGlobe(fig) {
  if (!window.d3 || !window.topojson || !window.WORLD110) return null;
  const svg = d3.select(fig).select('svg');
  const world = topojson.feature(WORLD110, WORLD110.objects.countries).features;
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
  const path = d3.geoPath(proj);
  const sea = svg.append('path').attr('class', 'g-sea');
  const grat = svg.append('path').attr('class', 'g-grat').datum(d3.geoGraticule10());
  const land = svg.append('g').selectAll('path').data(world).join('path')
    .attr('class', d => 'g-land' + (d.id === '398' ? ' kz' : d.id === '380' ? ' it' : ''));
  const arc = svg.append('path').attr('class', 'g-arc');
  const ROMA = [12.5, 41.9], AST = [71.43, 51.13], IT = [12.5, 42.5], KZ = [67, 47.5];
  const ip = d3.geoInterpolate(ROMA, AST);
  const km = Math.round(d3.geoDistance(ROMA, AST) * 6371 / 100) * 100;
  const kmEl = fig.querySelector('.dist b');
  if (kmEl) kmEl.textContent = group(km);
  const pts = svg.append('g').selectAll('g').data([{ p: ROMA, t: 'Roma' }, { p: AST, t: 'Astana' }]).join('g').attr('class', 'g-pt');
  pts.append('circle').attr('r', 5);
  pts.append('text').attr('x', 10).attr('y', 5).text(d => d.t);
  let rot = [-IT[0], -IT[1]], arcT = 0, raf = 0;
  function size() {
    const W = fig.clientWidth, H = fig.clientHeight;
    proj.translate([W / 2, H / 2]).scale(Math.max(10, Math.min(W, H) / 2 - 6));
    svg.attr('viewBox', '0 0 ' + W + ' ' + H);
  }
  function render() {
    proj.rotate(rot);
    sea.attr('d', path({ type: 'Sphere' }));
    grat.attr('d', path);
    land.attr('d', path);
    arc.attr('d', arcT > 0.001 ? path({ type: 'LineString', coordinates: Array.from({ length: 49 }, (_, i) => ip(arcT * i / 48)) }) : null);
    const c = [-rot[0], -rot[1]];
    pts.attr('transform', d => { const q = proj(d.p); return 'translate(' + q[0] + ',' + q[1] + ')'; })
      .style('opacity', d => (d3.geoDistance(d.p, c) < 1.4 ? 1 : 0));
  }
  function stop() { cancelAnimationFrame(raf); }
  function start() {
    stop(); size();
    const from = [-IT[0], -IT[1]], to = [-KZ[0], -KZ[1]];
    if (reduce) { rot = to; arcT = 1; fig.classList.add('kzon'); render(); return; }
    rot = from.slice(); arcT = 0; fig.classList.remove('kzon'); render();
    const t0 = performance.now(), HOLD = 900, D = 2800;
    const tick = now => {
      const t = now - t0;
      if (t > HOLD && t < HOLD + D) {
        const p = d3.easeCubicInOut((t - HOLD) / D);
        rot = [from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p];
        arcT = Math.min(1, p * 1.08);
      } else if (t >= HOLD + D) {
        if (!fig.classList.contains('kzon')) fig.classList.add('kzon');
        arcT = 1;
        const s = (t - HOLD - D) / 1000;
        rot = [to[0] + Math.sin(s * 0.45) * 7, to[1] + Math.sin(s * 0.3) * 2.5];
      }
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  const roG = new ResizeObserver(() => { size(); render(); });
  roG.observe(fig);
  size(); render();
  fig.classList.add('drawn');
  return { start, stop };
}

/* border map */
function makeMap(fig) {
  if (!window.d3 || !window.topojson || !window.REGION) return null;
  const svg = d3.select(fig).select('svg');
  const fc = topojson.feature(REGION, REGION.objects.countries).features;
  const kz = fc.find(f => f.id === '398');
  if (!kz) return null;
  const NB = { '643': 1, '156': 1, '417': 1, '860': 1, '795': 1 };
  const LAB = [
    { t: 'Russia', p: [62, 56.6] }, { t: 'Cina', p: [86.4, 44.2] }, { t: 'Kirghizistan', p: [75, 41.3] },
    { t: 'Uzbekistan', p: [63.4, 41.5] }, { t: 'Turkmenistan', p: [58.6, 39.4] }, { t: 'Mar Caspio', p: [50.7, 42], c: 'sea' }
  ];
  const proj = d3.geoAzimuthalEqualArea().rotate([-67, -48]).clipAngle(90);
  const path = d3.geoPath(proj);
  const sea = svg.append('rect').attr('class', 'm-sea');
  const others = svg.append('g').selectAll('path').data(fc.filter(f => f.id !== '398')).join('path')
    .attr('class', d => (NB[d.id] ? 'm-nb' : 'm-oth'));
  const kzp = svg.append('path').datum(kz).attr('class', 'm-kz');
  const labels = svg.append('g').selectAll('text').data(LAB).join('text')
    .attr('class', d => 'm-lab' + (d.c ? ' ' + d.c : '')).style('--d', (d, i) => i).text(d => d.t);
  const kzl = svg.append('text').attr('class', 'm-kzl').text('KAZAKISTAN');
  const comp = svg.append('g').attr('class', 'm-comp');
  comp.append('circle').attr('r', 22);
  comp.append('path').attr('d', 'M0 -15 L7 9 L0 4 L-7 9 Z');
  comp.append('text').attr('x', 0).attr('y', -33).text('N');
  function draw() {
    const W = fig.clientWidth, H = fig.clientHeight;
    if (!W || !H) return;
    svg.attr('viewBox', '0 0 ' + W + ' ' + H);
    sea.attr('width', W).attr('height', H);
    proj.fitExtent([[W * 0.1, H * 0.13], [W * 0.9, H * 0.87]], kz);
    others.attr('d', path);
    kzp.attr('d', path);
    const L = kzp.node().getTotalLength ? kzp.node().getTotalLength() : 4000;
    kzp.style('--len', Math.ceil(L));
    const fs = Math.max(10, Math.min(W / 50, 17));
    labels.attr('transform', d => 'translate(' + proj(d.p).join(',') + ')').style('font-size', fs + 'px');
    const c = proj([67.6, 48.3]);
    kzl.attr('x', c[0]).attr('y', c[1]).style('font-size', Math.max(11, Math.min(W / 24, 30)) + 'px');
    comp.attr('transform', 'translate(' + (W - 40) + ',62)');
  }
  const roM = new ResizeObserver(draw);
  roM.observe(fig);
  draw();
  fig.classList.add('drawn');
  return { start() {}, stop() {} };
}

/* thermometer */
function makeThermo(root) {
  const merc = $('.merc', root), bulb = $('.bulb', root), out = $('.read .t', root);
  const mc = $('.mk.cold', root), mh = $('.mk.hot', root);
  if (!merc || !bulb || !out) return null;
  let raf = 0;
  const A = [42, 151, 255], B = [255, 122, 26];
  const set = v => {
    merc.style.height = (v + 50) + '%';
    const p = (v + 40) / 80;
    const c = 'rgb(' + A.map((x, i) => Math.round(x + (B[i] - x) * p)).join(',') + ')';
    merc.style.background = c;
    bulb.style.background = c;
    const r = Math.round(v);
    out.textContent = (r < 0 ? '−' : r > 0 ? '+' : '') + Math.abs(r);
  };
  const seq = [[0, 0], [700, 0], [1900, -40], [2900, -40], [4700, 40]];
  function stop() { cancelAnimationFrame(raf); }
  function start() {
    stop();
    mc.classList.remove('show'); mh.classList.remove('show');
    if (reduce) { set(40); mc.classList.add('show'); mh.classList.add('show'); return; }
    set(0);
    const t0 = performance.now();
    const tick = now => {
      const t = now - t0;
      let v = 40;
      for (let i = 1; i < seq.length; i++) {
        if (t <= seq[i][0]) {
          const p = (t - seq[i - 1][0]) / (seq[i][0] - seq[i - 1][0]);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          v = seq[i - 1][1] + (seq[i][1] - seq[i - 1][1]) * e;
          break;
        }
      }
      set(v);
      if (t > 1900) mc.classList.add('show');
      if (t > 4700) mh.classList.add('show');
      if (t < 4800) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  set(0);
  return { start, stop };
}

/* effects per slide */
const fx = new Map();
for (const s of slides) {
  const kind = s.dataset.fx;
  let m = null;
  try {
    if (kind === 'globe') m = makeGlobe($('.globe', s));
    else if (kind === 'map') m = makeMap($('.map', s));
    else if (kind === 'thermo') m = makeThermo(s);
  } catch (e) { m = null; }
  if (m) fx.set(s, m);
}

function enter(s) {
  $$('.count', s).forEach(count);
  const m = fx.get(s);
  if (m) m.start();
}
function leave(s) {
  $$('.count', s).forEach(el => { cancelAnimationFrame(el._raf); el.textContent = cText(el, 0); });
  const m = fx.get(s);
  if (m) m.stop();
}

/* which slide is on screen */
const vis = new Map();
const io = new IntersectionObserver(entries => {
  for (const e of entries) vis.set(e.target, e.isIntersecting ? e.intersectionRect.height : 0);
  const vh = window.innerHeight;
  let best = -1, bh = -1;
  slides.forEach((s, i) => {
    const h = vis.get(s) || 0;
    if (h > bh) { bh = h; best = i; }
    const need = Math.min(vh, s.offsetHeight) * 0.5;
    if (h >= need && !s.classList.contains('on')) { s.classList.add('on'); enter(s); }
    else if (h < vh * 0.06 && s.classList.contains('on')) { s.classList.remove('on'); leave(s); }
  });
  if (best >= 0) setCur(best);
}, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
slides.forEach(s => io.observe(s));

/* open at the slide in the address, if any */
if (location.hash) {
  const target = document.getElementById(location.hash.slice(1));
  if (target && target.classList.contains('slide')) target.scrollIntoView({ behavior: 'auto', block: 'start' });
}

window.KZOK = true;
}
