const c = document.getElementById('c'), g = c.getContext('2d');
const rnd = (a, b) => a + Math.random() * (b - a);
const slow = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.25 : 1;
let W, H, horizon, stars = [], krs = [], lans = [], rips = [], T = 0;
const THEMES = {
  night: { sky: ['#050823', '#1a1a4d', '#4a3068'], water: ['#163b63', '#040918'], tree: '#04061a', stars: 1,
           moon: { x: 0.76, y: 0.34, r: 0.075, c: '#fff0c8', glow: '255,230,170' }, streak: '255,235,180' },
  dusk: { sky: ['#2b1b4e', '#9a4a78', '#ffa35e'], water: ['#7a3f6e', '#1a0b2a'], tree: '#1a0b24', stars: 0.15,
          moon: { x: 0.3, y: 0.8, r: 0.09, c: '#ffe0a8', glow: '255,170,90' }, streak: '255,190,120' },
  stars: { sky: ['#02030f', '#0a1240', '#1c2d70'], water: ['#10284f', '#02050f'], tree: '#02030c', stars: 3, band: true,
           moon: { x: 0.84, y: 0.2, r: 0.04, c: '#e8f0ff', glow: '180,210,255' }, streak: '200,225,255' },
  temple: { sky: ['#0a0a2a', '#2e1a55', '#8a4468'], water: ['#2a2a5a', '#05040f'], tree: '#06051a', stars: 0.7, temple: true,
            moon: { x: 0.72, y: 0.3, r: 0.07, c: '#ffe6a0', glow: '255,210,130' }, streak: '255,225,160' }
};
let TH = THEMES.night;
function makeStars() {
  stars = Array.from({ length: Math.floor((W * horizon / 5000 + 40) * TH.stars) },
    () => ({ x: rnd(0, W), y: rnd(0, horizon * 0.95), r: rnd(0.6, 1.8), p: rnd(0, 6.28) }));
}
function drawTemple() {
  const u = Math.min(W, H) / 900;
  g.fillStyle = TH.tree;
  [[0.26, 1.4], [0.15, 0.9], [0.37, 0.8]].forEach(([fx, sc]) => {
    const s = sc * u * 1.2, x = W * fx, b = horizon - 6;
    const P = [[44, 0], [44, 14], [32, 14], [32, 30], [22, 30], [22, 48], [13, 70], [6, 92], [3, 112], [0, 135]];
    g.beginPath(); g.moveTo(x - P[0][0] * s, b - P[0][1] * s);
    P.forEach(([dx, dy]) => g.lineTo(x - dx * s, b - dy * s));
    for (let i = P.length - 1; i >= 0; i--) g.lineTo(x + P[i][0] * s, b - P[i][1] * s);
    g.closePath(); g.fill();
  });
}

function resize() {
  const d = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight; horizon = H * 0.52;
  c.width = W * d; c.height = H * d;
  g.setTransform(d, 0, 0, d, 0, 0);
  makeStars();
}
addEventListener('resize', resize);
resize();

const depth = y => 0.35 + (y - horizon) / (H - horizon) * 1.1;
const kscale = k => depth(k.y) * (k.img || k.name || k.wish ? 1.35 : 1);
const nm = document.getElementById('nm'), ws = document.getElementById('ws'), pf = document.getElementById('pf'),
      pv = document.getElementById('pv'), go = document.getElementById('go');
let myImg = null;
if (document.fonts) document.fonts.load('600 16px Mali');
pf.addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  e.target.value = '';
  const im = new Image();
  im.onload = () => {
    const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n;
    const m = Math.min(im.width, im.height);
    cv.getContext('2d').drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, n, n);
    myImg = cv; pv.src = cv.toDataURL(); pv.className = 'on';
    setMode('kr'); addKr(W * 0.18, horizon + (H - horizon) * 0.78);
    broadcastAction('kr', { x: 0.18, y: 0.78, name: nm.value.trim(), wish: ws.value.trim(), img: cv.toDataURL() });
  };
  const say = t => { const h = document.getElementById('hint'); h.textContent = t; h.style.display = 'block'; };
  im.onerror = () => say('เปิดรูปนี้ไม่ได้ ลองใช้ไฟล์ JPG หรือ PNG');
  const fr = new FileReader();
  fr.onload = () => { im.src = fr.result; };
  fr.onerror = () => say('อ่านไฟล์รูปไม่ได้ ลองเปิดไฟล์นี้ในเบราว์เซอร์หรือ Live Server');
  fr.readAsDataURL(f);
});
go.addEventListener('click', () => {
  if (mode === 'kr') {
    const x = rnd(W * 0.05, W * 0.4), y = horizon + (H - horizon) * rnd(0.15, 0.9);
    addKr(x, y);
    broadcastAction('kr', { x: x / W, y: y / H, name: nm.value.trim(), wish: ws.value.trim(), img: myImg ? myImg.toDataURL() : null });
  } else if (mode === 'lan') {
    releaseLantern();
    broadcastAction('lan', { x: rnd(0.25, 0.75), y: 0.92, name: nm.value.trim(), wish: ws.value.trim() });
  } else {
    volley(6);
    broadcastAction('fw', { volley: 6 });
  }
});
[nm, ws].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); }));
let mode = 'kr';
const HINTS = {
  kr: 'คลิกผืนน้ำเพื่อลอยกระทง · คลิกที่กระทงเพื่ออ่านคำอธิษฐาน',
  lan: 'คลิกที่ใดก็ได้เพื่อลอยโคม · คลิกที่โคมเพื่ออ่านคำอธิษฐาน',
  fw: 'คลิกท้องฟ้าเพื่อจุดพลุ หรือกดปุ่มเพื่อยิงพลุต่อเนื่อง'
}, GO = { kr: 'ลอยกระทง', lan: 'ลอยโคม', fw: 'จุดพลุ' };
function setMode(m) {
  mode = m; go.textContent = GO[m]; document.getElementById('hint').textContent = HINTS[m];
  document.querySelectorAll('input[name=mode]').forEach(r => { r.checked = r.value === m; });
}
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', () => setMode(r.value)));
function perform(x, y) {
  if (mode === 'kr') {
    addKr(x, y);
    broadcastAction('kr', { x: x / W, y: y / H, name: nm.value.trim(), wish: ws.value.trim(), img: myImg ? myImg.toDataURL() : null });
  } else if (mode === 'lan') {
    releaseLantern(x, y);
    broadcastAction('lan', { x: x / W, y: y / H, name: nm.value.trim(), wish: ws.value.trim() });
  } else {
    const ty = y < horizon - 20 ? y : rnd(horizon * 0.15, horizon * 0.6);
    launch(x, ty);
    broadcastAction('fw', { x: x / W, ty: ty / H });
  }
}
setMode('kr');
addEventListener('keydown', e => { if (e.key === 'Escape') hideWish(); });
document.getElementById('theme').addEventListener('change', e => { TH = THEMES[e.target.value]; makeStars(); });

function addKr(x, y) {
  y = Math.max(y, horizon + (H - horizon) * 0.12);
  krs.push({ x, y, vx: rnd(8, 16), ph: rnd(0, 6.28), hue: rnd(318, 350), name: nm.value.trim(), wish: ws.value.trim(), img: myImg });
  rips.push({ x, y, r: 4, l: 1 });
  if (krs.length > 40) krs.shift();
}
for (let i = 0; i < 8; i++) addKr(rnd(0, W), horizon + (H - horizon) * rnd(0.15, 0.9));
['ขอให้ทุกคนมีสุขภาพแข็งแรง', 'ขอบคุณแม่น้ำที่หล่อเลี้ยงเรา', 'ขอให้ปีหน้าสมหวังทุกอย่าง'].forEach((w, i) => krs[i].wish = w);

c.addEventListener('pointerdown', e => {
  unlockFireworkAudio();
  const h = hit(e.clientX, e.clientY);
  if (h) return showWish(h.o, h.sx, h.sy);
  hideWish();
  perform(e.clientX, e.clientY);
});
addEventListener('keydown', e => {
  if (e.target.closest('input,button,label')) return;
  if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); go.click(); }
});

const el = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.283); g.fill(); };
function petal(px, py, w, h, lean) {
  g.beginPath(); g.moveTo(px, py);
  g.quadraticCurveTo(px - w, py - h * 0.5, px + lean, py - h);
  g.quadraticCurveTo(px + w, py - h * 0.5, px, py);
  g.fill();
}

function drawKr(k) {
  const s = kscale(k), u = 34 * s;
  const x = k.x, y = k.y + Math.sin(T * 1.6 + k.ph) * 1.5 * s;
  const fl = 0.85 + 0.15 * Math.sin(T * 9 + k.ph * 3) + 0.08 * Math.sin(T * 17 + k.ph);

  // glow reflected on the water
  g.save(); g.globalCompositeOperation = 'lighter';
  g.translate(x, y + u * 0.15); g.scale(1, 0.28);
  const rg = g.createRadialGradient(0, 0, 0, 0, 0, u * 4.2);
  rg.addColorStop(0, `rgba(255,190,90,${0.55 * fl})`); rg.addColorStop(1, 'rgba(255,150,60,0)');
  g.fillStyle = rg; g.beginPath(); g.arc(0, 0, u * 4.2, 0, 6.283); g.fill(); g.restore();

  // banana-leaf base
  g.fillStyle = '#15482e'; el(x, y + u * 0.05, u * 1.4, u * 0.5);
  g.fillStyle = '#2f7d4c'; el(x, y - u * 0.05, u * 1.22, u * 0.42);

  // lotus petals: outer ring then inner ring, back to front
  const ring = (R, lift, n, w, hh, light, rot) => {
    const a = [];
    for (let i = 0; i < n; i++) { const t = i / n * 6.283 + k.ph + rot; a.push([Math.sin(t), Math.cos(t)]); }
    a.sort((p, q) => p[0] - q[0]);
    for (const [sn, cs] of a) {
      g.fillStyle = `hsl(${k.hue},82%,${light + sn * 8}%)`;
      petal(x + cs * R, y - lift + sn * R * 0.34, w, hh, cs * u * 0.18);
    }
  };
  ring(u * 0.95, u * 0.05, 10, u * 0.3, u * 0.7, 58, 0);
  ring(u * 0.55, u * 0.25, 8, u * 0.26, u * 0.75, 72, 0.4);

  // incense stick
  g.strokeStyle = '#8a5a2b'; g.lineWidth = Math.max(1, u * 0.05);
  g.beginPath(); g.moveTo(x + u * 0.18, y - u * 0.2); g.lineTo(x + u * 0.55, y - u * 1.3); g.stroke();
  g.fillStyle = '#ff6a3a'; el(x + u * 0.55, y - u * 1.3, u * 0.05, u * 0.05);
  // candle
  g.fillStyle = '#fff3d6'; g.fillRect(x - u * 0.08, y - u * 1.05, u * 0.16, u * 0.85);
  // photo medallion on the front of the krathong
  if (k.img) {
    const r = u * 0.5, py = y + u * 0.05, b = Math.max(2, u * 0.08);
    g.fillStyle = '#ffd27a'; g.fillRect(x - r - b, py - r - b, (r + b) * 2, (r + b) * 2);
    g.drawImage(k.img, x - r, py - r, r * 2, r * 2);
    g.strokeStyle = '#a8742a'; g.lineWidth = 1;
    g.strokeRect(x - r - b, py - r - b, (r + b) * 2, (r + b) * 2);
    g.strokeRect(x - r, py - r, r * 2, r * 2);
  }

  // flame + glow
  const fx = x + Math.sin(T * 5 + k.ph) * u * 0.03, fy = y - u * 1.05;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(fx, fy - u * 0.15, 0, fx, fy - u * 0.15, u * 2.4);
  gl.addColorStop(0, `rgba(255,200,100,${0.5 * fl})`); gl.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = gl; g.fillRect(fx - u * 2.4, fy - u * 2.6, u * 4.8, u * 4.8); g.restore();
  const fh = u * 0.42 * fl;
  const fg = g.createLinearGradient(0, fy, 0, fy - fh);
  fg.addColorStop(0, '#ff9a2e'); fg.addColorStop(0.6, '#ffd54a'); fg.addColorStop(1, '#fff6c8');
  g.fillStyle = fg; g.beginPath(); g.moveTo(fx - u * 0.07, fy);
  g.quadraticCurveTo(fx - u * 0.1, fy - fh * 0.6, fx, fy - fh);
  g.quadraticCurveTo(fx + u * 0.1, fy - fh * 0.6, fx + u * 0.07, fy); g.fill();

  // name label floating on the water
  if (k.name) {
    g.font = `600 ${Math.max(12, 15 * s)}px Mali, Sarabun, "Noto Sans Thai", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'top';
    g.shadowColor = 'rgba(255,190,90,.9)'; g.shadowBlur = 10;
    g.fillStyle = '#ffe9b8'; g.fillText(k.name, x, y + u * 0.62);
    g.shadowBlur = 0;
  }
}

function drawLantern(l) {
  const s = l.s * (0.5 + l.y / H * 0.6), x = l.x, y = l.y;
  g.globalAlpha = Math.min(1, l.y / (horizon * 0.3));
  g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(x, y - 12 * s, 0, x, y - 12 * s, 38 * s);
  gl.addColorStop(0, 'rgba(255,170,70,.55)'); gl.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = gl; g.fillRect(x - 40 * s, y - 52 * s, 80 * s, 80 * s); g.restore();
  g.fillStyle = '#ff9d3c'; g.beginPath();
  g.moveTo(x - 5 * s, y); g.lineTo(x - 8 * s, y - 22 * s);
  g.quadraticCurveTo(x, y - 29 * s, x + 8 * s, y - 22 * s); g.lineTo(x + 5 * s, y); g.fill();
  g.fillStyle = '#fff0b0'; el(x, y - 2 * s, 2.5 * s, 2 * s);
  g.globalAlpha = 1;
}

// ---- fireworks ----
let rockets = [], sparks = [], flashes = [], queue = [], mylans = [];
function launch(x, ty) { rockets.push({ x, y: horizon - 4, ty: Math.max(40, Math.min(ty, horizon * 0.7)), t: [] }); }
function volley(n) {
  const slots = Math.max(0, 18 - queue.length - rockets.length);
  for (let i = 0; i < Math.min(n, slots); i++)
    queue.push({ at: T + i * 0.4, x: rnd(W * 0.12, W * 0.88), ty: rnd(horizon * 0.15, horizon * 0.6) });
}
let fireworkAudio = null;
function unlockFireworkAudio() {
  if (!fireworkAudio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) fireworkAudio = new AudioContext();
  }
  if (fireworkAudio && fireworkAudio.state === 'suspended') fireworkAudio.resume();
}
function fireworkSound() {
  unlockFireworkAudio();
  if (!fireworkAudio) return;
  const now = fireworkAudio.currentTime;
  const buffer = fireworkAudio.createBuffer(1, Math.floor(fireworkAudio.sampleRate * 1.2), fireworkAudio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    const decay = Math.pow(1 - i / samples.length, 3);
    samples[i] = (Math.random() * 2 - 1) * decay;
  }
  const noise = fireworkAudio.createBufferSource();
  noise.buffer = buffer;
  const highpass = fireworkAudio.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 700;
  const gain = fireworkAudio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.32, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  noise.connect(highpass).connect(gain).connect(fireworkAudio.destination);
  noise.start(now);
  noise.stop(now + 1.2);

  const boom = fireworkAudio.createOscillator();
  const boomGain = fireworkAudio.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(120, now);
  boom.frequency.exponentialRampToValueAtTime(38, now + 0.8);
  boomGain.gain.setValueAtTime(0.0001, now);
  boomGain.gain.exponentialRampToValueAtTime(0.45, now + 0.025);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  boom.connect(boomGain).connect(fireworkAudio.destination);
  boom.start(now);
  boom.stop(now + 0.95);
}
function burst(x, y) {
  const n = 70 + (Math.random() * 30 | 0), ring = Math.random() < 0.4, h1 = rnd(0, 360), h2 = h1 + rnd(50, 160);
  fireworkSound();
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283, sp = ring ? 170 : rnd(40, 210);
    sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, d: rnd(0.5, 0.9), h: i % 3 ? h1 : h2 });
  }
  flashes.push({ x, y, l: 1, h: h1 });
  if (sparks.length > 1600) sparks.splice(0, sparks.length - 1600);
}
function updFW(dt) {
  for (let i = queue.length - 1; i >= 0; i--) if (T >= queue[i].at) { launch(queue[i].x, queue[i].ty); queue.splice(i, 1); }
  for (const r of rockets) {
    r.y -= 420 * dt; r.t.push([r.x, r.y]); if (r.t.length > 8) r.t.shift();
    if (r.y <= r.ty) { r.done = true; burst(r.x, r.y); }
  }
  rockets = rockets.filter(r => !r.done);
  const drag = Math.pow(0.2, dt);
  for (const p of sparks) { p.vx *= drag; p.vy = p.vy * drag + 90 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= p.d * dt; }
  sparks = sparks.filter(p => p.l > 0);
  for (const f of flashes) { f.l -= dt * 3; }
  flashes = flashes.filter(f => f.l > 0);
}
function drawFW(refl) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  if (!refl) {
    for (const r of rockets) {
      g.strokeStyle = 'rgba(255,230,170,.8)'; g.lineWidth = 2; g.beginPath();
      r.t.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    }
    for (const f of flashes) {
      const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, 140 * f.l);
      gr.addColorStop(0, `hsla(${f.h},100%,80%,${0.35 * f.l})`); gr.addColorStop(1, `hsla(${f.h},100%,60%,0)`);
      g.fillStyle = gr; g.fillRect(f.x - 140, f.y - 140, 280, 280);
    }
  }
  for (const p of sparks) {
    if (refl && p.y >= horizon) continue;
    const y2 = refl ? horizon + (horizon - p.y) * 0.45 : p.y, k = refl ? -0.45 : 1;
    g.strokeStyle = `hsla(${p.h},100%,65%,${p.l * (refl ? 0.22 : 1)})`; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(p.x - p.vx * 0.03, y2 - p.vy * 0.03 * k); g.lineTo(p.x, y2); g.stroke();
  }
  g.restore();
}

// ---- user lanterns ----
function releaseLantern(px, py) {
  mylans.push({ x: px ?? rnd(W * 0.25, W * 0.75), y: py ?? H * 0.92, vy: rnd(26, 38), ph: rnd(0, 6.28), s: 1.7, name: nm.value.trim(), wish: ws.value.trim() });
  if (mylans.length > 20) mylans.shift();
}
function drawMine(l) {
  drawLantern(l);
  if (!l.name) return;
  const s = l.s * (0.5 + l.y / H * 0.6);
  g.font = `600 ${Math.max(12, 12 * s)}px Mali, Sarabun, "Noto Sans Thai", sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'top'; g.globalAlpha = Math.min(1, l.y / (horizon * 0.3));
  g.shadowColor = 'rgba(255,190,90,.9)'; g.shadowBlur = 8; g.fillStyle = '#ffe9b8';
  g.fillText(l.name, l.x, l.y + 6 * s); g.shadowBlur = 0; g.globalAlpha = 1;
}

// ---- wish card (click a krathong or lantern) ----
const wc = document.getElementById('wish'), wi = document.getElementById('wi'),
      wn = document.getElementById('wn'), wt = document.getElementById('wt');
document.getElementById('wx').addEventListener('click', () => hideWish());
function hideWish() { wc.hidden = true; }
function showWish(o, sx, sy) {
  if (o.img) { wi.src = o.img.toDataURL(); wi.style.display = 'block'; } else wi.style.display = 'none';
  wn.textContent = o.name || ''; wn.style.display = o.name ? 'block' : 'none';
  wt.textContent = o.wish || 'ยังไม่มีคำอธิษฐาน'; wt.className = o.wish ? '' : 'none';
  wc.hidden = false;
  wc.style.left = Math.max(8, Math.min(sx - wc.offsetWidth / 2, W - wc.offsetWidth - 8)) + 'px';
  wc.style.top = Math.max(8, sy - wc.offsetHeight - 10) + 'px';
}
function hit(px, py) {
  for (const l of mylans) {
    const s = l.s * (0.5 + l.y / H * 0.6);
    if (Math.hypot(px - l.x, py - (l.y - 14 * s)) < 22 * s) return { o: l, sx: l.x, sy: l.y - 32 * s };
  }
  for (const k of [...krs].sort((a, b) => b.y - a.y)) {
    const u = 34 * kscale(k);
    if (Math.abs(px - k.x) < u * 1.4 && py > k.y - u * 1.5 && py < k.y + u * 0.7) return { o: k, sx: k.x, sy: k.y - u * 1.5 };
  }
}

function update(dt) {
  for (const k of krs) k.x += k.vx * depth(k.y) * dt;
  krs = krs.filter(k => k.x < W + 90);
  while (krs.length < 7) { krs.push({ x: -60, y: horizon + (H - horizon) * rnd(0.15, 0.9), vx: rnd(8, 16), ph: rnd(0, 6.28), hue: rnd(318, 350) }); }
  if (Math.random() < dt * 1.2 && lans.length < 26)
    lans.push({ x: rnd(0, W), y: horizon + rnd(0, 20), vy: rnd(10, 22), ph: rnd(0, 6.28), s: rnd(0.6, 1.1) });
  for (const l of lans) { l.y -= l.vy * dt; l.x += Math.sin(T * 0.7 + l.ph) * 6 * dt; }
  lans = lans.filter(l => l.y > -40);
  for (const r of rips) { r.r += 50 * dt; r.l -= 0.5 * dt; }
  rips = rips.filter(r => r.l > 0);
  updFW(dt);
  for (const l of mylans) { l.y -= l.vy * dt; l.x += Math.sin(T * 0.7 + l.ph) * 8 * dt; }
  mylans = mylans.filter(l => l.y > -60);
}

function draw() {
  // sky
  const sk = g.createLinearGradient(0, 0, 0, horizon);
  sk.addColorStop(0, TH.sky[0]); sk.addColorStop(0.7, TH.sky[1]); sk.addColorStop(1, TH.sky[2]);
  g.fillStyle = sk; g.fillRect(0, 0, W, horizon + 1);
  if (TH.band) {
    g.save(); g.translate(W * 0.5, horizon * 0.4); g.rotate(-0.45);
    const bg = g.createLinearGradient(0, -horizon * 0.35, 0, horizon * 0.35);
    bg.addColorStop(0, 'rgba(160,190,255,0)'); bg.addColorStop(0.5, 'rgba(190,200,255,.16)'); bg.addColorStop(1, 'rgba(160,190,255,0)');
    g.fillStyle = bg; g.fillRect(-W, -horizon * 0.35, W * 2, horizon * 0.7); g.restore();
  }
  g.fillStyle = '#fff';
  for (const s of stars) { g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(T * 0.8 + s.p)); g.fillRect(s.x, s.y, s.r, s.r); }
  g.globalAlpha = 1;

  // full moon
  const M = TH.moon, mx = W * M.x, my = horizon * M.y, mr = Math.min(W, H) * M.r;
  const mg = g.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 5);
  mg.addColorStop(0, `rgba(${M.glow},.35)`); mg.addColorStop(1, `rgba(${M.glow},0)`);
  g.fillStyle = mg; g.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
  g.fillStyle = M.c; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill();

  // sky lanterns (rise from behind the far bank)
  for (const l of lans) drawLantern(l);

  drawFW(false);
  // treeline
  g.fillStyle = TH.tree; g.beginPath(); g.moveTo(0, horizon + 2);
  for (let x = 0; x <= W; x += 5) {
    const h = 12 + 10 * Math.sin(x * 0.013) + 7 * Math.sin(x * 0.041 + 1) + 4 * Math.sin(x * 0.11);
    g.lineTo(x, horizon - h);
  }
  g.lineTo(W, horizon + 2); g.fill();
  if (TH.temple) drawTemple();

  // river
  const wg = g.createLinearGradient(0, horizon, 0, H);
  wg.addColorStop(0, TH.water[0]); wg.addColorStop(1, TH.water[1]);
  g.fillStyle = wg; g.fillRect(0, horizon, W, H - horizon);
  for (let i = 0; i < 22; i++) {
    const t = i / 22, yy = horizon + 4 + t * (H - horizon) * 0.5;
    const w = mr * 1.6 * (1 - t * 0.3) * (0.4 + 0.6 * Math.abs(Math.sin(T * 1.2 + i * 1.7)));
    g.fillStyle = `rgba(${TH.streak},${0.28 * (1 - t)})`;
    g.fillRect(mx + Math.sin(T * 0.9 + i) * 6 - w / 2, yy, w, 2 + t * 2);
  }
  for (let i = 1; i <= 26; i++) {
    const t = i / 26, y0 = horizon + Math.pow(t, 1.6) * (H - horizon), amp = 1 + t * 4;
    g.strokeStyle = `rgba(150,190,255,${0.05 + t * 0.05})`; g.lineWidth = 1 + t;
    g.beginPath();
    for (let x = 0; x <= W; x += 12) {
      const y = y0 + Math.sin(x * 0.02 / (0.3 + t) + T * (0.6 + t) + i) * amp;
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  for (const r of rips) {
    g.strokeStyle = `rgba(255,220,150,${r.l * 0.6})`; g.lineWidth = 1.5;
    g.beginPath(); g.ellipse(r.x, r.y, Math.max(0.1, r.r), Math.max(0.1, r.r * 0.3), 0, 0, 6.283); g.stroke();
  }

  // krathongs, far to near
  drawFW(true);
  [...krs].sort((a, b) => a.y - b.y).forEach(drawKr);
  mylans.forEach(drawMine);
}

let last = performance.now();
(function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05) * slow; last = now; T += dt;
  update(dt); draw(); requestAnimationFrame(frame);
})(last);

// ---- shared events and active users ----
const visitorId = sessionStorage.getItem('krathongVisitorId') ||
  (`${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);
sessionStorage.setItem('krathongVisitorId', visitorId);
let lastSequence = 0;
const online = document.getElementById('online');
const isStaticSite = window.location.protocol === 'https:' && window.location.hostname.endsWith('github.io');
const SHARED_API = 'https://leone-islands-dvd-pays.trycloudflare.com';
const staticTabs = new Map([[visitorId, Date.now()]]);
const receivedActionIds = new Set();
function applySharedPacket(packet) {
  if (!packet) return;
  const age = packet.createdAt ? Math.max(0, (Date.now() - packet.createdAt) / 1000) : Infinity;
  if ((packet.type === 'fw' && age > (packet.data && packet.data.volley ? 2.5 : 1.5)) ||
      (packet.type === 'lan' && age > 20) ||
      (packet.type === 'kr' && age > 60)) return;
  const actionId = packet.actionId;
  if (actionId && receivedActionIds.has(actionId)) return;
  if (actionId) receivedActionIds.add(actionId);
  const data = packet.data || {};
  if (data.visitorId === visitorId) return;
  if (packet.type === 'kr') {
    const y = Math.max(data.y * H, horizon + (H - horizon) * 0.12);
    const vx = rnd(8, 16);
    const x = data.x * W + vx * depth(y) * age;
    if (x <= W + 90) externalImage(data.img, image => krs.push({
      x, y, vx, ph: rnd(0, 6.28), hue: rnd(318, 350),
      name: data.name || '', wish: data.wish || '', img: image
    }));
  }
  if (packet.type === 'lan') {
    const vy = rnd(26, 38), y = data.y * H - vy * age;
    if (y > -60) mylans.push({
      x: data.x * W, y, vy, ph: rnd(0, 6.28), s: 1.7,
      name: data.name || '', wish: data.wish || ''
    });
  }
  if (packet.type === 'fw') {
    if (data.volley) volley(Math.max(0, data.volley - Math.floor(age / 0.4)));
    else launch(data.x * W, data.ty * H);
  }
}

async function broadcastAction(type, data) {
  if (window.location.protocol === 'https:' && window.location.hostname.endsWith('github.io')) {
    const packet = { actionId: `${visitorId}-${Date.now()}-${Math.random()}`, type, data: { ...data, visitorId } };
    try {
      await fetch(`${SHARED_API}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ type: packet.type, data: packet.data }),
        keepalive: true
      });
    } catch (_) {}
    return;
  }
  try {
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data: { ...data, visitorId } })
    });
  } catch (_) {}
}

async function heartbeat() {
  if (isStaticSite) {
    try {
      await fetch(`${SHARED_API}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ id: visitorId, seenAt: Date.now() })
      });
      const response = await fetch(`${SHARED_API}/api/state?after=0`);
      if (response.ok) {
        const state = await response.json();
        online.textContent = `กำลังใช้งานอยู่ ${state.users} คน`;
      }
    } catch (_) {}
    return;
  }
  try {
    const response = await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: visitorId })
    });
    if (response.ok) {
      const state = await response.json();
      online.textContent = `กำลังใช้งานอยู่ ${state.users} คน`;
    }
  } catch (_) {
    online.textContent = 'ออฟไลน์';
  }
}

function externalImage(src, callback) {
  if (!src) return callback(null);
  const image = new Image();
  image.onload = () => callback(image);
  image.onerror = () => callback(null);
  image.src = src;
}

async function pollState() {
  if (isStaticSite) {
    try {
      const response = await fetch(`${SHARED_API}/api/state?after=${lastSequence}`);
      if (!response.ok) return;
      const state = await response.json();
      lastSequence = Math.max(lastSequence, state.sequence);
      online.textContent = `กำลังใช้งานอยู่ ${state.users} คน`;
      for (const event of state.events) {
        applySharedPacket({ actionId: `server-${event.seq}`, type: event.type, data: event.data, createdAt: event.createdAt });
      }
    } catch (_) {}
    return;
  }
  try {
    const response = await fetch(`/api/state?after=${lastSequence}`);
    if (!response.ok) return;
    const state = await response.json();
    lastSequence = Math.max(lastSequence, state.sequence);
    online.textContent = `กำลังใช้งานอยู่ ${state.users} คน`;
    for (const event of state.events) {
      applySharedPacket({ actionId: `server-${event.seq}`, type: event.type, data: event.data, createdAt: event.createdAt });
    }
  } catch (_) {}
}

function startStaticStream() {
  if (!isStaticSite) return;
  setInterval(pollState, 500);
}

heartbeat();
pollState();
startStaticStream();
setInterval(heartbeat, 10000);
setInterval(pollState, 1000);
