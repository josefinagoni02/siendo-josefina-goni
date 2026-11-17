/* Lunática: luna en vivo (Buenos Aires, hemisferio sur), dial para girarla, taller con su lema,
   calendario de lunas nuevas y llenas, y la sección Talleres con fotos.
   Los talleres se guardan en talleres.json (o en el bloque #talleres-data de la página) y las fotos como assets. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAY = 86400000, HR = 3600000, R = Math.PI / 180, SYN = 29.530588853;
  const n360 = x => ((x % 360) + 360) % 360;
  const SIGNS = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
  const DOW = ['dom','lun','mar','mié','jue','vie','sáb'];
  const MON = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const pad = x => String(x).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- astronomía (Meeus, baja precisión) ---------- */
  function astro(ms) {
    const T = (ms / DAY + 2440587.5 - 2451545) / 36525, s = x => Math.sin(x * R);
    const Lp = 218.3164477 + 481267.88123421 * T, D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T, Mp = 134.9633964 + 477198.8675055 * T, F = 93.2720950 + 483202.0175233 * T;
    const lm = Lp + 6.289 * s(Mp) + 1.274 * s(2 * D - Mp) + 0.658 * s(2 * D) + 0.214 * s(2 * Mp) - 0.186 * s(M) - 0.114 * s(2 * F);
    const ls = 280.46646 + 36000.76983 * T + 1.914602 * s(M) + 0.019993 * s(2 * M);
    const i = n360(180 - D - 6.289 * s(Mp) + 2.1 * s(M) - 1.274 * s(2 * D - Mp) - 0.658 * s(2 * D) - 0.214 * s(2 * Mp) - 0.11 * s(D));
    return { el: n360(lm - ls), i: i > 180 ? 360 - i : i, k: (1 + Math.cos(i * R)) / 2, lon: n360(lm) };
  }
  function cross(ms, target, dir) {
    const f = t => n360(astro(t).el - target + 180) - 180;
    let prev = f(ms);
    for (let h = 6; h < 24 * 32; h += 6) {
      const t2 = ms + dir * h * HR, v = f(t2);
      if (Math.sign(v) !== Math.sign(prev) && Math.abs(v - prev) < 90) {
        let a = t2 - dir * 6 * HR, b = t2;
        for (let j = 0; j < 28; j++) { const m = (a + b) / 2; if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m; }
        return (a + b) / 2;
      }
      prev = v;
    }
    return ms + dir * 15 * DAY;
  }
  const phaseName = el => el < 8 || el > 352 ? 'Luna nueva' : el < 82 ? 'Creciente' : el < 98 ? 'Cuarto creciente' : el < 172 ? 'Gibosa creciente' : el < 188 ? 'Luna llena' : el < 262 ? 'Gibosa menguante' : el < 278 ? 'Cuarto menguante' : 'Menguante';
  const signOf = lon => SIGNS[Math.floor(lon / 30) % 12];
  // hora de Buenos Aires (UTC−3, sin horario de verano)
  const ar = ms => new Date(ms - 3 * HR);
  const fmt = ms => { const d = ar(ms); return `${DOW[d.getUTCDay()]} ${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}`; };
  const fmtLong = ms => { const d = ar(ms); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} de ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const fmtT = ms => { const d = ar(ms); return `${fmt(ms)} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} h`; };
  const rel = d => { const r = Math.round(d); return r === 0 ? 'hoy' : r > 0 ? `en ${r} día${r === 1 ? '' : 's'}` : `hace ${-r} día${r === -1 ? '' : 's'}`; };

  /* ---------- talleres ---------- */
  let data = { updated: 0, talleres: [] };
  try { const el = document.getElementById('talleres-data'); if (el) data = JSON.parse(el.textContent); } catch (e) {}
  // la hora de inicio sale del horario ("18.30 a 20.30 h" → 18:30); si no hay, 19 h
  const tOf = w => { const m = /(\d{1,2})(?:[:.](\d{2}))?/.exec(w.hora || ''); const hh = m ? pad(Math.min(23, +m[1])) : '19', mm = m && m[2] ? m[2] : '00'; const t = Date.parse(`${w.date}T${hh}:${mm}:00-03:00`); return Number.isFinite(t) ? t : Date.parse(`${w.date}T19:00:00-03:00`); };
  const list = () => (data.talleres || []).filter(w => w && w.date).map(w => Object.assign(w, { t: tOf(w) })).sort((a, b) => a.t - b.t);
  const photoUrl = p => p && (p.url || (p.id ? '/_blob/' + p.id : ''));
  const cover = w => (w.fotos || [])[w.portada || 0] || (w.fotos || [])[0];
  // si hay una versión más nueva en talleres.json, se usa esa
  fetch('talleres.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
    if (j && Array.isArray(j.talleres) && (j.updated || 0) >= (data.updated || 0)) { data = j; refresh(); }
  }).catch(() => {});

  /* ---------- luna realista: mapa de albedo + iluminación por píxel ---------- */
  let albedoCache = {}, tex = null;
  // foto real de la cara visible (img/luna.jpg: mapa LROC de la NASA ya proyectado como disco y girado 180° para el hemisferio sur)
  (function loadTex() {
    const im = new Image();
    im.onload = () => { tex = im; albedoCache = {}; refresh(); };
    im.src = 'img/luna.jpg';
  })();
  function albedoReal(N) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(tex, 0, 0, N, N);
    return x.getImageData(0, 0, N, N).data;
  }
  function albedo(N) {
    if (albedoCache[N]) return albedoCache[N];
    if (tex) { try { return (albedoCache[N] = albedoReal(N)); } catch (e) { tex = null; } }
    const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
    const u = v => (v + 1) / 2 * N, rr = v => v / 2 * N;
    x.fillStyle = 'rgb(206,204,198)'; x.fillRect(0, 0, N, N);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let j = 0; j < 260; j++) { const px = rnd() * 2 - 1, py = rnd() * 2 - 1, r0 = 0.02 + rnd() * 0.09, g = x.createRadialGradient(u(px), u(-py), 0, u(px), u(-py), rr(r0)); const v = rnd() > 0.5 ? 255 : 120; g.addColorStop(0, `rgba(${v},${v},${v - 6},${0.05 + rnd() * 0.06})`); g.addColorStop(1, `rgba(${v},${v},${v},0)`); x.fillStyle = g; x.fillRect(0, 0, N, N); }
    const MARIA = [[-0.6, 0.12, 0.34, 0.5], [-0.52, -0.12, 0.26, 0.45], [-0.7, 0.32, 0.18, 0.35], [-0.3, 0.42, 0.27, 0.55], [-0.1, 0.5, 0.14, 0.4], [0.17, 0.42, 0.17, 0.55], [0.32, 0.14, 0.2, 0.55], [0.18, 0.2, 0.1, 0.35], [0.66, 0.3, 0.12, 0.62], [0.55, -0.12, 0.15, 0.45], [0.34, -0.28, 0.09, 0.45], [-0.2, -0.33, 0.18, 0.42], [-0.45, -0.4, 0.1, 0.5], [-0.05, 0.05, 0.1, 0.3], [-0.25, 0.66, 0.08, 0.35], [0.0, 0.68, 0.08, 0.35], [0.25, 0.66, 0.07, 0.3], [-0.45, 0.62, 0.07, 0.3]];
    MARIA.forEach(([px, py, r0, a]) => { const g = x.createRadialGradient(u(px), u(-py), 0, u(px), u(-py), rr(r0)); g.addColorStop(0, `rgba(70,72,78,${a})`); g.addColorStop(0.6, `rgba(76,78,84,${a * 0.75})`); g.addColorStop(1, 'rgba(80,80,86,0)'); x.fillStyle = g; x.fillRect(0, 0, N, N); });
    for (let j = 0; j < 140; j++) { const px = rnd() * 2 - 1, py = rnd() * 2 - 1, r0 = 0.006 + Math.pow(rnd(), 3) * 0.04; x.fillStyle = `rgba(60,60,64,${0.12 + rnd() * 0.12})`; x.beginPath(); x.arc(u(px), u(-py), rr(r0), 0, Math.PI * 2); x.fill(); x.strokeStyle = `rgba(255,255,250,${0.1 + rnd() * 0.1})`; x.lineWidth = Math.max(0.6, rr(r0) * 0.35); x.beginPath(); x.arc(u(px) - rr(r0) * 0.15, u(-py) - rr(r0) * 0.15, rr(r0), 0, Math.PI * 2); x.stroke(); }
    [[-0.15, -0.66, 0.035, 26, 0.5], [-0.32, 0.17, 0.03, 16, 0.28], [-0.62, 0.24, 0.02, 10, 0.22]].forEach(([px, py, r0, nr, ra]) => {
      x.save(); x.translate(u(px), u(-py));
      for (let q = 0; q < nr; q++) { const ang = rnd() * Math.PI * 2, len = rr(ra) * (0.4 + rnd() * 0.8); const g = x.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len); g.addColorStop(0, 'rgba(255,255,250,0.22)'); g.addColorStop(1, 'rgba(255,255,250,0)'); x.strokeStyle = g; x.lineWidth = rr(0.006 + rnd() * 0.008); x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(ang) * len, Math.sin(ang) * len); x.stroke(); }
      const g = x.createRadialGradient(0, 0, 0, 0, 0, rr(r0 * 2.2)); g.addColorStop(0, 'rgba(255,255,252,0.9)'); g.addColorStop(0.4, 'rgba(245,245,240,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, rr(r0 * 2.2), 0, Math.PI * 2); x.fill();
      x.restore();
    });
    const out = document.createElement('canvas'); out.width = out.height = N; const o = out.getContext('2d');
    o.translate(N, N); o.rotate(Math.PI); o.drawImage(c, 0, 0); // vista del hemisferio sur
    return (albedoCache[N] = o.getImageData(0, 0, N, N).data);
  }
  const tmps = {};
  const tmpCv = D => tmps[D] || (tmps[D] = Object.assign(document.createElement('canvas'), { width: D, height: D }));
  function drawMoon(cv, ms, opts = {}) {
    const x = cv.getContext('2d'), S = cv.width, padPx = Math.round(S * (opts.pad != null ? opts.pad : 0.17)), D = S - padPx * 2, rD = D / 2;
    const a = astro(ms), A = albedo(D);
    const side = a.el < 180 ? -1 : 1; // sur: la creciente se ilumina a la izquierda
    const ii = a.i * R, Lx = Math.sin(ii) * side, Lz = Math.cos(ii);
    x.clearRect(0, 0, S, S);
    if (opts.glow !== false) {
      const g = x.createRadialGradient(S / 2, S / 2, rD * 0.95, S / 2, S / 2, S * 0.5);
      g.addColorStop(0, `rgba(214,222,255,${0.05 + 0.3 * a.k})`); g.addColorStop(0.35, `rgba(201,210,255,${0.02 + 0.12 * a.k})`); g.addColorStop(1, 'rgba(201,210,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    }
    const img = x.createImageData(D, D), d = img.data, dark = opts.dark != null ? opts.dark : 0.22;
    for (let py = 0; py < D; py++) {
      const ny = (rD - py - 0.5) / rD;
      for (let px = 0; px < D; px++) {
        const nx = (px + 0.5 - rD) / rD, rr2 = nx * nx + ny * ny, o = (py * D + px) * 4;
        if (rr2 > 1) { d[o + 3] = 0; continue; }
        const nz = Math.sqrt(1 - rr2), mu0 = nx * Lx + nz * Lz;
        const t = Math.min(1, Math.max(0, (mu0 + 0.012) / 0.045)), soft = t * t * (3 - 2 * t);
        const ls = mu0 > 0 ? (2 * mu0 / (mu0 + nz + 0.0001)) : 0;
        let b = Math.min(1.12, ls * 0.6 + 0.45 * soft) * soft;
        b += 0.03 * (1 - soft) * (1 - a.k); // luz cenicienta, apenas
        const edge = Math.min(1, (1 - Math.sqrt(rr2)) * rD * 0.9);
        const g = A[o] * b * 1.06; d[o] = Math.min(255, g); d[o + 1] = Math.min(255, g); d[o + 2] = Math.min(255, g * 1.02);
        d[o + 3] = 255 * Math.max(0, edge) * Math.max(soft, dark);
      }
    }
    const tmp = tmpCv(D); tmp.getContext('2d').putImageData(img, 0, 0);
    x.fillStyle = 'rgba(7,9,20,0.32)'; x.beginPath(); x.arc(S / 2, S / 2, rD - 0.5, 0, Math.PI * 2); x.fill();
    x.drawImage(tmp, padPx, padPx);
    return a;
  }

  /* ---------- edición (solo para quien puede editar la landing) ---------- */
  let assets = null, art = null, canEdit = false, saving = false;
  (async () => {
    try {
      if (!window.claude || !window.claude.use) return;
      [assets, art] = await Promise.all([window.claude.use('assets'), window.claude.use('artifact')]);
      canEdit = !!(assets && art);
      if (canEdit) refresh();
    } catch (e) {}
  })();
  async function save(msg) {
    if (!canEdit || saving) return false;
    saving = true; toast('Guardando…');
    data.updated = Date.now();
    const json = JSON.stringify(data);
    try {
      await art.publish({ 'talleres.json': { content: json, contentType: 'application/json' } });
      saving = false; toast(msg || 'Guardado'); return true;
    } catch (e) {
      const code = e && e.code;
      if (code === 'capability_disabled' || code === 'not_granted' || code === 'read_only_path') {
        // si no se puede guardar solo el archivo, se reescribe el bloque de datos de la página
        try {
          const src = await (await fetch('index.html', { cache: 'no-store' })).text();
          const re = /(<script type="application\/json" id="talleres-data">)[\s\S]*?(<\/script>)/;
          if (!re.test(src) || !/^\s*<!doctype/i.test(src)) throw new Error('src');
          try { sessionStorage.setItem('lz-reopen', JSON.stringify(view)); } catch (er) {}
          await art.publish(src.replace(re, (m, a, b) => a + json.replace(/</g, '\\u003c') + b));
          saving = false; return true;
        } catch (e2) {
          saving = false; toast(e2 && e2.code === 'conflict' ? 'Alguien guardó antes: se recarga la página' : 'No se pudo guardar desde acá'); return false;
        }
      }
      if (code === 'not_writer' || code === 'not_declared') { canEdit = false; refresh(); }
      saving = false; toast(code === 'conflict' ? 'Alguien guardó antes: se recarga la página' : code === 'rate_limited' ? 'Esperá unos segundos y probá de nuevo' : 'No se pudo guardar'); return false;
    }
  }
  async function shrink(file) {
    // las fotos se achican a 2000 px de lado para que carguen rápido
    try {
      if (!/^image\/(jpeg|png|webp|heic|heif)/.test(file.type) && file.type) return file;
      const bmp = await createImageBitmap(file);
      const s = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      if (s === 1 && file.size < 1.5e6) return file;
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return await new Promise(res => c.toBlob(b => res(b || file), 'image/jpeg', 0.86));
    } catch (e) { return file; }
  }

  /* ---------- estado de la vista ---------- */
  let root = null, panel = null, off = 0, raf = 0, dragA = null, timer = 0, view = { name: 'luna' }, shown = null, phases = [];
  const $ = sel => root && root.querySelector(sel);
  let toastT = 0;
  function toast(t) {
    if (!root) return;
    let el = root.querySelector('.lz-toast');
    if (!el) { el = document.createElement('div'); el.className = 'lz-toast'; el.setAttribute('role', 'status'); root.appendChild(el); }
    el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
  }

  /* ---------- vista Luna ---------- */
  const WA = 'https://chat.whatsapp.com/E16ZKquB4Uj5HLRH1IPvfQ?mode=gi_t';
  const waIco = '<svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5a7.5 7.5 0 0 0-6.5 11.2L2.5 17.5l3.9-1A7.5 7.5 0 1 0 10 2.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.2 7.6c.2 1.9 2.4 4.4 4.9 5 .5.1 1.1-.4 1.3-.9l-1.4-.8-.7.6c-.9-.4-1.7-1.2-2.1-2.1l.6-.7-.8-1.4c-.5.2-1 .8-.9 1.3Z" fill="currentColor"/></svg>';
  function lunaHTML() {
    return `
      <div class="lz-main">
        <div class="lz-moon-col">
          <div class="lz-dial first" id="lzDial" tabindex="0" role="slider" data-noswipe aria-label="Girá la luna para mover los días" aria-valuemin="-180" aria-valuemax="180" aria-valuenow="0">
            <canvas class="lz-ring" width="640" height="640"></canvas>
            <canvas class="lz-moon" width="440" height="440"></canvas>
            <span class="lz-hint" aria-hidden="true">↻ Girá la luna para mover los días</span>
          </div>
          <div class="lz-read"><span class="lz-pct"></span><span class="lz-phase"></span><span class="lz-when"></span></div>
          <button class="lz-today" type="button" hidden>Volver a hoy</button>
        </div>
        <div class="lz-ws">
          <div class="lz-card" aria-live="polite"></div>
          <div class="lz-chips">
            <button class="lz-chip solid" type="button" data-lz="talleres">Talleres <span aria-hidden="true">→</span></button>
            <a class="lz-chip" href="${WA}" target="_blank" rel="noopener">${waIco} Unirme a la comunidad <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </div>
      <div class="lz-calwrap">
        <div class="lz-cal-head"><span class="label">Lunas nuevas y llenas</span>
          <div class="lz-seg" role="group" aria-label="Filtrar calendario"><button type="button" data-cf="all" aria-pressed="true">Todas</button><button type="button" data-cf="ws" aria-pressed="false">Solo con taller</button></div></div>
        <div class="lz-cal" data-noswipe></div>
      </div>`;
  }
  function render() {
    if (!root || view.name !== 'luna') return;
    const t = Date.now() + off * DAY;
    const a = drawMoon($('.lz-moon'), t);
    drawRing(t);
    $('.lz-pct').innerHTML = `${Math.round(a.k * 100)}<small>%</small>`;
    $('.lz-phase').textContent = `${phaseName(a.el)} en ${signOf(a.lon)}`;
    const isNow = Math.abs(off) < 0.02;
    $('.lz-when').textContent = isNow ? `Ahora · ${fmtT(t)}` : `${fmt(t)} · ${rel(off)}`;
    $('.lz-today').hidden = isNow;
    const dial = $('.lz-dial');
    dial.setAttribute('aria-valuenow', Math.round(off)); dial.setAttribute('aria-valuetext', `${fmt(t)}, ${phaseName(a.el)}, ${Math.round(a.k * 100)}%`);
    renderCard(t);
    phases.forEach(p => p.el && p.el.classList.toggle('sel', Math.abs(p.t - t) < 1.2 * DAY));
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
  const setOff = v => { off = Math.max(-180, Math.min(180, v)); schedule(); };
  function animateTo(target) {
    const start = off; if (reduce) { setOff(target); return; }
    const t0 = performance.now(), dur = Math.min(1400, 500 + Math.abs(target - start) * 12);
    (function step(now) { if (!root || view.name !== 'luna') return; const p = Math.min(1, (now - t0) / dur), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; off = start + (target - start) * e; render(); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function drawRing(t) {
    const cv = $('.lz-ring'), x = cv.getContext('2d'), S = cv.width, c = S / 2, r = S * 0.455;
    x.clearRect(0, 0, S, S);
    const rot = -astro(t).el * R; // el día que estás mirando siempre arriba: gira el anillo
    x.save(); x.translate(c, c);
    for (let d = 0; d < 59; d++) {
      const an = (d / 59 * 360 * R) + rot - Math.PI / 2, r1 = r - (d % 2 === 0 ? S * 0.022 : S * 0.012);
      x.strokeStyle = `rgba(238,240,255,${d % 2 === 0 ? 0.32 : 0.16})`; x.lineWidth = 2;
      x.beginPath(); x.moveTo(Math.cos(an) * r1, Math.sin(an) * r1); x.lineTo(Math.cos(an) * r, Math.sin(an) * r); x.stroke();
    }
    [0, 180].forEach(el => {
      const an = el * R + rot - Math.PI / 2, px = Math.cos(an) * (r - S * 0.06), py = Math.sin(an) * (r - S * 0.06);
      x.fillStyle = el ? 'rgba(253,252,255,0.9)' : 'rgba(16,22,52,1)'; x.strokeStyle = 'rgba(238,240,255,0.6)'; x.lineWidth = 2;
      x.beginPath(); x.arc(px, py, S * 0.012, 0, Math.PI * 2); x.fill(); x.stroke();
    });
    list().forEach(w => {
      if (Math.abs((w.t - t) / DAY) > 14.7) return;
      const an = (astro(w.t).el * R) + rot - Math.PI / 2, rr = r + S * 0.02;
      x.fillStyle = '#e0607e'; x.beginPath(); x.arc(Math.cos(an) * rr, Math.sin(an) * rr, S * 0.011, 0, Math.PI * 2); x.fill();
    });
    x.fillStyle = '#c9d2ff'; x.beginPath(); x.moveTo(0, -r - S * 0.006); x.lineTo(-S * 0.016, -r - S * 0.036); x.lineTo(S * 0.016, -r - S * 0.036); x.closePath(); x.fill();
    x.restore();
  }
  function renderCard(t) {
    const card = $('.lz-card'), L = list(), now = Date.now();
    if (!L.length) { card.hidden = true; return; }
    card.hidden = false;
    const w = Math.abs(off) < 0.02 ? (L.find(x => x.t > now) || L[L.length - 1]) : L.reduce((b, x) => Math.abs(x.t - t) < Math.abs(b.t - t) ? x : b, L[0]);
    const lit = Math.abs(w.t - t) < 1.5 * DAY;
    card.classList.toggle('lit', lit);
    const key = w.id + '|' + (w.fotos || []).length + '|' + data.updated;
    if (key === shown) return;
    shown = key;
    const future = w.t > now, idx = L.indexOf(w), fotos = w.fotos || [];
    card.innerHTML = `
      <div class="lz-top"><span class="lz-state${future ? ' next' : ''}">${future ? 'Próximo taller' : 'Último taller'}</span><span class="lz-rel">${fmt(w.t)} · ${rel((w.t - now) / DAY)}</span></div>
      <p class="lz-name">${esc(w.name)}</p>
      ${w.lema ? `<p class="lz-lema">${esc(w.lema)}</p>` : ''}
      <dl class="lz-dl">${w.hora ? `<div><dt>Horario</dt><dd>${esc(w.hora)}</dd></div>` : ''}${w.lugar ? `<div><dt>Dónde</dt><dd>${esc(w.lugar)}</dd></div>` : ''}${w.con ? `<div><dt>Con</dt><dd>${esc(w.con)}</dd></div>` : ''}</dl>
      ${future ? `<div class="lz-act">${w.link ? `<a class="cta" href="${esc(w.link)}" target="_blank" rel="noopener">Sacá tu entrada <span aria-hidden="true">↗</span></a>` : ''}${w.nota ? `<span class="lz-rel">${esc(w.nota)}</span>` : ''}</div>`
               : `${fotos.length ? `<button class="lz-thumbs" type="button" data-open="${esc(w.id)}" aria-label="Ver las ${fotos.length} fotos de ${esc(w.name)}">${fotos.slice(0, 4).map(p => `<img src="${esc(photoUrl(p))}" alt="" loading="lazy">`).join('')}</button>` : ''}
                  <div class="lz-act"><button class="cta alt" type="button" data-open="${esc(w.id)}">${fotos.length ? `Ver las ${fotos.length} fotos` : 'Ver en Talleres'} <span aria-hidden="true">→</span></button></div>`}
      <div class="lz-nav"><button type="button" data-go="${idx - 1}" ${idx > 0 ? '' : 'disabled'}>← Anterior</button><button type="button" data-go="${idx + 1}" ${idx < L.length - 1 ? '' : 'disabled'}>Siguiente →</button></div>`;
  }
  function buildCal() {
    const cal = $('.lz-cal'); if (!cal) return;
    const L = list(), now = Date.now();
    const first = Math.min(now - 75 * DAY, ...(L.length ? [L[0].t - 20 * DAY] : []));
    let t = first; const end = now + 160 * DAY;
    phases = [];
    while (t < end) { const tn = cross(t, 0, 1), tf = cross(t, 180, 1), x = Math.min(tn, tf); phases.push({ t: x, full: x === tf }); t = x + DAY; }
    // cada taller va con la luna más cercana
    L.forEach(w => { let best = null; phases.forEach(p => { if (!best || Math.abs(p.t - w.t) < Math.abs(best.t - w.t)) best = p; }); if (best && Math.abs(best.t - w.t) < 8 * DAY) (best.ws = best.ws || []).push(w); });
    cal.innerHTML = '';
    let placed = false, nowEl = null;
    phases.forEach(p => {
      if (!placed && p.t > now) { nowEl = document.createElement('span'); nowEl.className = 'lz-nowmark'; nowEl.textContent = 'hoy'; cal.appendChild(nowEl); placed = true; }
      const a = astro(p.t), w = p.ws && p.ws[0];
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lz-ph' + (p.t < now ? ' was' : '') + (w ? ' has' : '');
      const row = document.createElement('span'); row.className = 'lz-row';
      const cv = document.createElement('canvas'); cv.width = cv.height = 112; drawMoon(cv, p.t, { pad: 0.06, glow: false, dark: 0.85 });
      row.appendChild(cv);
      const cp = w && cover(w);
      if (cp) row.insertAdjacentHTML('beforeend', `<img class="lz-ph-img" src="${esc(photoUrl(cp))}" alt="" loading="lazy">`);
      b.appendChild(row);
      b.insertAdjacentHTML('beforeend', `<span class="lz-d">${fmt(p.t)}</span><b>${p.full ? 'Llena' : 'Nueva'} en ${signOf(a.lon)}</b>${w && w.lema ? `<span class="lz-lm">${esc(w.lema)}</span>` : ''}${w ? `<span class="lz-tg">Taller ${fmt(w.t).split(' ')[1]}${w.t < now && (w.fotos || []).length ? ' · ' + w.fotos.length + ' fotos' : ''}</span>` : ''}`);
      b.setAttribute('aria-label', `Luna ${p.full ? 'llena' : 'nueva'} en ${signOf(a.lon)}, ${fmt(p.t)}${w ? ', taller ' + w.name : ''}`);
      b.addEventListener('click', () => animateTo(((w ? w.t : p.t) - Date.now()) / DAY));
      p.el = b; cal.appendChild(b);
    });
    if (nowEl) requestAnimationFrame(() => { cal.scrollLeft = nowEl.offsetLeft - cal.clientWidth / 2; });
  }
  function wireLuna() {
    const dial = $('.lz-dial'), hd = Math.min(2, window.devicePixelRatio || 1);
    const mc = $('.lz-moon'); mc.width = mc.height = Math.round(440 * hd);
    const angleAt = e => { const b = dial.getBoundingClientRect(); return Math.atan2(e.clientY - b.top - b.height / 2, e.clientX - b.left - b.width / 2); };
    dial.addEventListener('pointerdown', e => { dragA = angleAt(e); dial.setPointerCapture(e.pointerId); dial.classList.add('dragging'); dial.classList.remove('first'); });
    dial.addEventListener('pointermove', e => {
      if (dragA === null) return;
      const a = angleAt(e); let d = a - dragA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; dragA = a;
      setOff(off + d / (2 * Math.PI) * SYN); // una vuelta = un ciclo
    });
    ['pointerup', 'pointercancel'].forEach(ev => dial.addEventListener(ev, () => { dragA = null; dial.classList.remove('dragging'); }));
    dial.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowUp') { setOff(off + 1); e.preventDefault(); }
      else if (k === 'ArrowLeft' || k === 'ArrowDown') { setOff(off - 1); e.preventDefault(); }
      else if (k === 'Home') { animateTo(0); e.preventDefault(); }
    });
    setTimeout(() => dial.classList.remove('first'), 3400);
    $('.lz-today').addEventListener('click', () => animateTo(0));
    root.querySelectorAll('[data-cf]').forEach(b => b.addEventListener('click', () => {
      const only = b.dataset.cf === 'ws', cal = $('.lz-cal');
      cal.classList.toggle('only', only);
      root.querySelectorAll('[data-cf]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const nm = cal.querySelector('.lz-nowmark'); cal.scrollLeft = only ? 0 : (nm ? nm.offsetLeft - cal.clientWidth / 2 : 0);
    }));
  }

  /* ---------- vista Talleres ---------- */
  // la luna del taller: la nueva o llena más cercana a la fecha
  function moonOf(w) { const c = [cross(w.t, 180, 1), cross(w.t, 180, -1), cross(w.t, 0, 1), cross(w.t, 0, -1)]; return c.reduce((m, x) => Math.abs(x - w.t) < Math.abs(m - w.t) ? x : m, c[0]); }
  function moonThumb(t, size) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size; drawMoon(cv, t, { pad: 0.2, dark: 0.7 }); return cv;
  }
  function talleresHTML() {
    const L = list().slice().reverse(), now = Date.now();
    return `
      <div class="lz-vhead">
        <button class="lz-back" type="button" data-lz="luna">← Lunática</button>
        <span class="label">Fanática de la luna</span><h2 class="d-title" id="d-title">Talleres</h2>
        <p class="d-text">Cada luna, un encuentro. Acá quedan lo que trabajamos y las fotos.</p>
      </div>
      ${canEdit ? `<div class="lz-admin"><button class="lz-chip solid" type="button" data-edit="new">+ Agregar taller</button><span class="lz-rel">Solo vos ves estas opciones.</span></div>` : ''}
      <div class="lz-grid">${L.map(w => {
        const cp = cover(w), n = (w.fotos || []).length, future = w.t > now;
        return `<button class="lz-tc" type="button" data-open="${esc(w.id)}">
          <span class="lz-tc-img">${cp ? `<img src="${esc(photoUrl(cp))}" alt="" loading="lazy">` : `<span class="lz-tc-moon" data-moon="${moonOf(w)}"></span>`}
            ${future ? '<span class="lz-badge">Próximo</span>' : n ? `<span class="lz-badge soft">${n} fotos</span>` : ''}</span>
          <span class="lz-tc-in"><span class="lz-k">${fmt(w.t)}${w.lugar ? ' · ' + esc(w.lugar) : ''}</span><span class="lz-tc-t">${esc(w.name)}</span>${w.lema ? `<span class="lz-tc-l">${esc(w.lema)}</span>` : ''}</span>
        </button>`;
      }).join('') || '<p class="d-text">Todavía no hay talleres cargados.</p>'}</div>`;
  }
  function tallerHTML(w) {
    const now = Date.now(), future = w.t > now, fotos = w.fotos || [];
    // la luna del taller: la nueva o llena más cercana a la fecha
    const tp = moonOf(w), a = astro(tp);
    return `
      <div class="lz-vhead">
        <button class="lz-back" type="button" data-lz="talleres">← Talleres</button>
        <span class="label">${fmtLong(w.t)}</span><h2 class="d-title" id="d-title">${esc(w.name)}</h2>
      </div>
      <div class="lz-tw">
        <div class="lz-tw-moon"><canvas width="${Math.round(240 * Math.min(2, window.devicePixelRatio || 1))}" height="${Math.round(240 * Math.min(2, window.devicePixelRatio || 1))}" data-moon-big="${tp}"></canvas><span class="lz-rel">${a.k > 0.5 ? 'Luna llena' : 'Luna nueva'} en ${signOf(a.lon)} · ${fmt(tp)}</span></div>
        <div class="lz-tw-txt">
          ${w.lema ? `<p class="lz-lema big">${esc(w.lema)}</p>` : ''}
          ${w.desc ? `<p class="d-text">${esc(w.desc)}</p>` : ''}
          <dl class="lz-dl">${w.hora ? `<div><dt>Horario</dt><dd>${esc(w.hora)}</dd></div>` : ''}${w.lugar ? `<div><dt>Dónde</dt><dd>${esc(w.lugar)}${w.dir ? `<br><a class="lz-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.dir)}" target="_blank" rel="noopener">${esc(w.dir)} ↗</a>` : ''}</dd></div>` : ''}${w.con ? `<div><dt>Con</dt><dd>${esc(w.con)}</dd></div>` : ''}</dl>
          ${future && w.link ? `<div class="lz-act"><a class="cta" href="${esc(w.link)}" target="_blank" rel="noopener">Sacá tu entrada <span aria-hidden="true">↗</span></a>${w.nota ? `<span class="lz-rel">${esc(w.nota)}</span>` : ''}</div>` : ''}
          ${canEdit ? `<div class="lz-admin"><button class="lz-chip" type="button" data-edit="${esc(w.id)}">Editar datos</button></div>` : ''}
        </div>
      </div>
      <div class="lz-photos-wrap">
        <div class="lz-cal-head"><span class="label">Fotos${fotos.length ? ' · ' + fotos.length : ''}</span>
          ${canEdit ? `<label class="lz-chip solid lz-up">Subir fotos<input type="file" id="lzUp" accept="image/*" multiple></label>` : ''}</div>
        ${fotos.length ? `<div class="lz-photos">${fotos.map((p, i) => `<figure class="lz-ph-f"><button type="button" data-lb="${i}" aria-label="Ver foto ${i + 1} de ${fotos.length}"><img src="${esc(photoUrl(p))}" alt="Foto ${i + 1} del taller ${esc(w.name)}" loading="lazy"></button>
            ${canEdit ? `<span class="lz-ph-ed">${(w.portada || 0) === i ? '<span class="lz-badge">Portada</span>' : `<button type="button" data-cover="${i}">Hacer portada</button>`}<button type="button" data-del="${i}">Quitar</button></span>` : ''}</figure>`).join('')}</div>`
          : `<p class="d-text">${canEdit ? 'Subí las fotos del encuentro: la primera queda de portada.' : future ? 'Las fotos aparecen después del encuentro.' : 'Pronto, las fotos de este encuentro.'}</p>`}
      </div>
      <div class="lz-lb" hidden><button class="lz-lb-x" type="button" aria-label="Cerrar foto">×</button><button class="lz-lb-n" type="button" data-step="-1" aria-label="Foto anterior">←</button><img alt=""><button class="lz-lb-n" type="button" data-step="1" aria-label="Foto siguiente">→</button><span class="lz-lb-c"></span></div>`;
  }
  const FIELDS = [['name', 'Nombre', 'text', 'Luna Llena en Géminis'], ['date', 'Fecha', 'date', ''], ['hora', 'Horario', 'text', '19 a 21 h'], ['lugar', 'Lugar', 'text', 'Café, barrio'], ['dir', 'Dirección (para el mapa)', 'text', 'Calle 123, Localidad'], ['con', 'Con', 'text', 'Dos Mitades'], ['lema', 'Lema', 'text', 'La frase del taller'], ['desc', 'Descripción', 'area', ''], ['link', 'Link de entrada', 'url', 'https://'], ['nota', 'Nota junto a la entrada', 'text', 'El taller es gratuito.']];
  function formHTML(w) {
    const v = w || {};
    return `
      <div class="lz-vhead"><button class="lz-back" type="button" data-lz="${w ? 'taller' : 'talleres'}">← ${w ? esc(w.name) : 'Talleres'}</button>
        <h2 class="d-title" id="d-title">${w ? 'Editar taller' : 'Nuevo taller'}</h2></div>
      <form class="lz-form" id="lzForm" novalidate>
        ${FIELDS.map(([k, l, type, ph]) => `<label class="lz-f${type === 'area' ? ' wide' : ''}"><span>${l}</span>${type === 'area' ? `<textarea id="lzf-${k}" name="${k}" rows="3">${esc(v[k])}</textarea>` : `<input id="lzf-${k}" name="${k}" type="${type}" value="${esc(v[k])}" placeholder="${esc(ph)}"${k === 'name' || k === 'date' ? ' required' : ''}>`}</label>`).join('')}
        <p class="lz-err" id="lzErr" hidden></p>
        <div class="lz-act wide"><button class="cta" type="submit">Guardar</button>
          ${w ? `<span class="lz-del-wrap"><button class="lz-chip" type="button" data-askdel>Borrar taller</button><span class="lz-confirm" hidden>¿Seguro? <button class="lz-chip danger" type="button" data-dodel="${esc(w.id)}">Sí, borrar</button><button class="lz-chip" type="button" data-nodel>No</button></span></span>` : ''}</div>
      </form>`;
  }

  /* ---------- montaje y navegación ---------- */
  const dropLb = () => document.querySelectorAll('body > .lz-lb').forEach(n => n.remove());
  function go(v) {
    view = v; shown = null; dropLb();
    if (!root) return;
    panel.dataset.kind = v.name === 'luna' ? 'luna' : 'talleres';
    const head = root.querySelector('.lz-luna-head');
    if (head) { head.hidden = v.name !== 'luna'; const h = head.querySelector('h2'); if (h) h.id = v.name === 'luna' ? 'd-title' : ''; }
    const box = root.querySelector('.lz-view');
    if (v.name === 'luna') { box.innerHTML = lunaHTML(); wireLuna(); buildCal(); render(); }
    else if (v.name === 'talleres') { box.innerHTML = talleresHTML(); box.querySelectorAll('[data-moon]').forEach(el => el.appendChild(moonThumb(+el.dataset.moon, 200))); }
    else if (v.name === 'taller') { const w = list().find(x => x.id === v.id); if (!w) return go({ name: 'talleres' }); box.innerHTML = tallerHTML(w); const cv = box.querySelector('[data-moon-big]'); if (cv) drawMoon(cv, +cv.dataset.moonBig, { pad: 0.14 }); wireTaller(w); }
    else if (v.name === 'form') { const w = v.id && list().find(x => x.id === v.id); box.innerHTML = formHTML(w); wireForm(w); }
    if (v.name !== 'luna') panel.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const t = root.querySelector('.lz-back, .lz-dial'); if (t && v.name !== 'luna') t.focus({ preventScroll: true });
  }
  function refresh() {
    updateHomeCard();
    if (!root) return;
    if (view.name === 'luna') { shown = null; buildCal(); render(); }
    else if (view.name !== 'form') go(view);
  }
  function wireTaller(w) {
    const box = root.querySelector('.lz-view'), lb = box.querySelector('.lz-lb'), fotos = w.fotos || [];
    document.body.appendChild(lb); // fuera del modal, para que ocupe toda la pantalla
    let li = 0;
    const show = i => { li = (i + fotos.length) % fotos.length; lb.querySelector('img').src = photoUrl(fotos[li]); lb.querySelector('img').alt = `Foto ${li + 1} del taller ${w.name}`; lb.querySelector('.lz-lb-c').textContent = `${li + 1} / ${fotos.length}`; };
    box.querySelectorAll('[data-lb]').forEach(b => b.addEventListener('click', () => { show(+b.dataset.lb); lb.hidden = false; lb.querySelector('.lz-lb-x').focus(); }));
    lb.querySelector('.lz-lb-x').addEventListener('click', () => { lb.hidden = true; });
    lb.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => show(li + +b.dataset.step)));
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(li + 1); if (e.key === 'ArrowLeft') show(li - 1); if (e.key === 'Escape') { e.stopPropagation(); lb.hidden = true; } });
    const up = box.querySelector('#lzUp');
    if (up) up.addEventListener('change', async () => {
      const files = [...up.files]; if (!files.length) return;
      const added = [];
      for (let i = 0; i < files.length; i++) {
        toast(`Subiendo ${i + 1} de ${files.length}…`);
        try { const blob = await shrink(files[i]); const r = await assets.upload(blob); added.push({ id: r.id, url: r.url }); }
        catch (e) { toast(e && e.code === 'too_large' ? 'Una foto es demasiado pesada' : e && e.code === 'quota_exceeded' ? 'No queda espacio para más fotos' : 'No se pudo subir una foto'); }
      }
      if (!added.length) return;
      w.fotos = (w.fotos || []).concat(added);
      if (await save(`${added.length} foto${added.length === 1 ? '' : 's'} guardada${added.length === 1 ? '' : 's'}`)) go({ name: 'taller', id: w.id });
    });
    box.querySelectorAll('[data-cover]').forEach(b => b.addEventListener('click', async () => { w.portada = +b.dataset.cover; if (await save('Portada actualizada')) go({ name: 'taller', id: w.id }); }));
    box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '¿Quitar?'; setTimeout(() => { b.dataset.sure = ''; b.textContent = 'Quitar'; }, 3000); return; }
      const i = +b.dataset.del, [gone] = w.fotos.splice(i, 1);
      if ((w.portada || 0) >= w.fotos.length || (w.portada || 0) === i) w.portada = 0;
      if (await save('Foto quitada')) { try { if (gone && gone.id) await assets.delete(gone.id); } catch (e) {} go({ name: 'taller', id: w.id }); }
    }));
  }
  function wireForm(w) {
    const f = root.querySelector('#lzForm'), err = root.querySelector('#lzErr');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const v = {}; FIELDS.forEach(([k]) => { v[k] = (f.elements[k].value || '').trim(); });
      if (!v.name || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) { err.hidden = false; err.textContent = 'Completá el nombre y la fecha.'; return; }
      if (v.link && !/^https?:\/\//.test(v.link)) { err.hidden = false; err.textContent = 'El link de entrada tiene que empezar con https://'; return; }
      err.hidden = true;
      let target = w;
      if (!target) { target = { id: 't' + Date.now().toString(36), fotos: [], portada: 0 }; data.talleres.push(target); }
      FIELDS.forEach(([k]) => { if (v[k]) target[k] = v[k]; else delete target[k]; });
      if (await save(w ? 'Cambios guardados' : 'Taller agregado')) go({ name: 'taller', id: target.id });
    });
    const ask = root.querySelector('[data-askdel]');
    if (ask) {
      const conf = root.querySelector('.lz-confirm');
      ask.addEventListener('click', () => { conf.hidden = false; ask.hidden = true; });
      root.querySelector('[data-nodel]').addEventListener('click', () => { conf.hidden = true; ask.hidden = false; });
      root.querySelector('[data-dodel]').addEventListener('click', async () => {
        data.talleres = data.talleres.filter(x => x.id !== w.id);
        if (await save('Taller borrado')) go({ name: 'talleres' });
      });
    }
  }
  function onClick(e) {
    const nav = e.target.closest('[data-lz]');
    if (nav) { e.preventDefault(); const to = nav.dataset.lz; go(to === 'taller' ? { name: 'taller', id: view.id } : { name: to }); return; }
    const op = e.target.closest('[data-open]');
    if (op) { go({ name: 'taller', id: op.dataset.open }); return; }
    const ed = e.target.closest('[data-edit]');
    if (ed) { go({ name: 'form', id: ed.dataset.edit === 'new' ? null : ed.dataset.edit }); return; }
    const g = e.target.closest('.lz-nav [data-go]');
    if (g && !g.disabled) { const w = list()[+g.dataset.go]; if (w) animateTo((w.t - Date.now()) / DAY); }
  }
  function mount(body) {
    root = body; panel = body.closest('.panel');
    off = 0; dragA = null;
    let start = { name: 'luna' };
    try { const s = sessionStorage.getItem('lz-reopen'); if (s) { start = JSON.parse(s); sessionStorage.removeItem('lz-reopen'); } } catch (e) {}
    view = start;
    root.addEventListener('click', onClick);
    go(start);
    clearInterval(timer);
    timer = setInterval(() => { if (view.name === 'luna' && Math.abs(off) < 0.02) render(); }, 60000);
  }
  function unmount() {
    if (root) root.removeEventListener('click', onClick);
    clearInterval(timer); dropLb(); root = null; panel = null; view = { name: 'luna' };
  }

  /* ---------- card de la home: misma card, texto al día ---------- */
  function updateHomeCard() {
    const el = document.querySelector('#lunCard .next-k'); if (!el) return;
    const L = list(), now = Date.now(); if (!L.length) return;
    const next = L.find(w => w.t > now), w = next || L[L.length - 1];
    el.textContent = `${next ? 'Próximo' : 'Último'}: ${w.name} · ${fmt(w.t)}`;
  }
  updateHomeCard();

  window.Lunatica = { mount, unmount };
  // si se guardó reescribiendo la página, vuelve a abrir donde estabas
  try { if (sessionStorage.getItem('lz-reopen')) setTimeout(() => { const c = document.getElementById('lunCard'); if (c) c.click(); }, 900); } catch (e) {}
})();
