'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let RS = 1; // pixels écran par pixel virtuel (netteté sur écrans HD)

function resizeCanvas() {
    const container = document.getElementById('game');
    const ratio = VW / VH;
    let w = container.clientWidth, h = container.clientHeight;
    if (w / h > ratio) w = h * ratio; else h = w / ratio;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    RS = canvas.width / VW;
    const stage = document.getElementById('stage');
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    stage.style.setProperty('--u', (h / VH) + 'px');
    Background.rebuild();
}

// ---------------------------------------------------------------- Thèmes
const THEMES = [
    { name: 'Aube sur le village', sky: ['#6f86d6', '#c99ad0', '#ffae8a', '#ffe2a9'], sun: { x: 520, y: 300, r: 42, c: '#fff1c2', glow: 'rgba(255,200,140,' },
      stars: 0, fuji: '#6c6fae', snow: '#ffe9ef', far: '#8a82b8', mid: '#4f5b8a', bamboo: '#2f5a4a', mist: 'rgba(255,200,170,0.35)', cloud: 'rgba(255,225,215,0.8)', petal: '#ffb7c5', night: false },
    { name: 'Plein jour', sky: ['#4fa3e8', '#8ecbf5', '#c9ecff', '#eaf9ff'], sun: { x: 640, y: 90, r: 34, c: '#fffbe0', glow: 'rgba(255,240,170,' },
      stars: 0, fuji: '#5a86b8', snow: '#ffffff', far: '#7aa6c9', mid: '#4f8a6b', bamboo: '#2d6a3a', mist: 'rgba(255,255,255,0.4)', cloud: 'rgba(255,255,255,0.9)', petal: '#ffb7c5', night: false },
    { name: 'Crépuscule rouge', sky: ['#2e2a66', '#8a3f8f', '#e0587a', '#ffa860'], sun: { x: 300, y: 290, r: 50, c: '#ffd08a', glow: 'rgba(255,140,90,' },
      stars: 20, fuji: '#4a3a7a', snow: '#ffc9b0', far: '#6b3d80', mid: '#3d2a5e', bamboo: '#24213f', mist: 'rgba(255,130,100,0.3)', cloud: 'rgba(255,170,150,0.75)', petal: '#ff9fb5', night: false },
    { name: 'Nuit de lune', sky: ['#070b24', '#10194a', '#1f2d6b', '#35498f'], sun: { x: 600, y: 85, r: 28, c: '#f4f1dc', glow: 'rgba(190,210,255,' },
      stars: 70, fuji: '#1e2a5c', snow: '#9fb2e8', far: '#1a2557', mid: '#121b45', bamboo: '#0b2a2a', mist: 'rgba(90,120,220,0.25)', cloud: 'rgba(120,140,200,0.35)', petal: '#ffc2d6', night: true },
    { name: 'Nuit des étoiles', sky: ['#03040f', '#0d0a33', '#2a1459', '#5a2a82'], sun: { x: 250, y: 110, r: 42, c: '#f6f0ff', glow: 'rgba(200,170,255,' },
      stars: 150, fuji: '#241a55', snow: '#c8a8ff', far: '#23195a', mid: '#160f40', bamboo: '#0d1f2e', mist: 'rgba(170,90,255,0.22)', cloud: 'rgba(160,120,220,0.3)', petal: '#e8b4ff', night: true }
];

function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function makeLayer(tileW, fn) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(tileW * RS); c.height = Math.ceil(VH * RS);
    const g = c.getContext('2d');
    g.scale(RS, RS);
    fn(g);
    return { c, tileW };
}

// Silhouettes décoratives
function ridge(g, tileW, base, amps, seed, color) {
    const r = rng(seed);
    const ph = amps.map(() => r() * Math.PI * 2);
    const h = x => { let y = base; amps.forEach(([a, k], i) => { y += Math.sin(x / tileW * Math.PI * 2 * k + ph[i]) * a; }); return y; };
    g.beginPath(); g.moveTo(0, VH);
    for (let x = 0; x <= tileW; x += 8) g.lineTo(x, h(x));
    g.lineTo(tileW, VH); g.closePath(); g.fillStyle = color; g.fill();
    return h;
}

function mist(g, y0, y1, color) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, color);
    g.fillStyle = gr; g.fillRect(0, y0, 4000, y1 - y0);
}

function pagoda(g, cx, by, s, color) {
    g.fillStyle = color;
    let y = by;
    for (let i = 0; i < 4; i++) {
        const hw = (24 - i * 4) * s, bh = 11 * s;
        g.fillRect(cx - hw * 0.7, y - bh, hw * 1.4, bh);
        g.beginPath();
        g.moveTo(cx - hw - 12 * s, y - bh + 3 * s);
        g.quadraticCurveTo(cx - hw * 0.4, y - bh - 1 * s, cx, y - bh - 10 * s);
        g.quadraticCurveTo(cx + hw * 0.4, y - bh - 1 * s, cx + hw + 12 * s, y - bh + 3 * s);
        g.closePath(); g.fill();
        y -= bh + 7 * s;
    }
    g.fillRect(cx - 1.5 * s, y - 14 * s, 3 * s, 18 * s);
}

function torii(g, cx, by, s, color) {
    g.fillStyle = color;
    const w = 34 * s, h = 50 * s;
    g.fillRect(cx - w / 2, by - h, 5 * s, h); g.fillRect(cx + w / 2 - 5 * s, by - h, 5 * s, h);
    g.beginPath();
    g.moveTo(cx - w / 2 - 13 * s, by - h - 8 * s);
    g.quadraticCurveTo(cx, by - h + 2 * s, cx + w / 2 + 13 * s, by - h - 8 * s);
    g.lineTo(cx + w / 2 + 9 * s, by - h + 3 * s);
    g.quadraticCurveTo(cx, by - h + 12 * s, cx - w / 2 - 9 * s, by - h + 3 * s);
    g.closePath(); g.fill();
    g.fillRect(cx - w / 2, by - h + 17 * s, w, 4 * s);
}

function pine(g, x, by, s, color) {
    g.fillStyle = color;
    g.fillRect(x - 2 * s, by - 10 * s, 4 * s, 10 * s);
    for (let i = 0; i < 3; i++) {
        const b = by - 8 * s - i * 14 * s, hw = (17 - i * 4) * s;
        g.beginPath(); g.moveTo(x - hw, b); g.lineTo(x, b - 20 * s); g.lineTo(x + hw, b); g.closePath(); g.fill();
    }
}

function bamboo(g, x, top, bottom, w, color, light) {
    g.fillStyle = color;
    g.fillRect(x - w / 2, top, w, bottom - top);
    g.fillStyle = light;
    g.fillRect(x - w / 2, top, w * 0.28, bottom - top);
    for (let y = bottom - 34; y > top + 8; y -= 38) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x - w / 2 - 1, y, w + 2, 3); }
    // feuilles
    g.strokeStyle = color; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
        const y = top + 14 + i * 22, dir = i % 2 ? 1 : -1;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dir * 18, y - 10, x + dir * 30, y + 6); g.stroke();
    }
}

function stoneLantern(g, x, by, s, color, glow) {
    g.fillStyle = color;
    g.fillRect(x - 12 * s, by - 6 * s, 24 * s, 6 * s);
    g.fillRect(x - 4 * s, by - 30 * s, 8 * s, 24 * s);
    g.fillRect(x - 12 * s, by - 34 * s, 24 * s, 5 * s);
    g.fillRect(x - 9 * s, by - 50 * s, 18 * s, 16 * s);
    g.beginPath(); g.moveTo(x - 18 * s, by - 50 * s); g.lineTo(x, by - 64 * s); g.lineTo(x + 18 * s, by - 50 * s); g.closePath(); g.fill();
    if (glow) {
        const gr = g.createRadialGradient(x, by - 42 * s, 2, x, by - 42 * s, 50 * s);
        gr.addColorStop(0, 'rgba(255,210,120,0.55)'); gr.addColorStop(1, 'rgba(255,210,120,0)');
        g.fillStyle = gr; g.fillRect(x - 55 * s, by - 95 * s, 110 * s, 110 * s);
        g.fillStyle = '#ffd98a'; g.fillRect(x - 5 * s, by - 46 * s, 10 * s, 8 * s);
    } else {
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x - 5 * s, by - 46 * s, 10 * s, 8 * s);
    }
}

// ---------------------------------------------------------------- Décor
const Background = {
    theme: THEMES[0], themeIndex: 0, sky: null, layers: null, vignette: null, clouds: [], petals: [],

    setTheme(i) { this.themeIndex = clamp(i, 0, THEMES.length - 1); this.theme = THEMES[this.themeIndex]; this.rebuild(); },

    rebuild() {
        const T = this.theme;
        this.sky = makeLayer(VW, g => {
            const gr = g.createLinearGradient(0, 0, 0, VH);
            T.sky.forEach((c, i) => gr.addColorStop(i / (T.sky.length - 1), c));
            g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
            const r = rng(7 + this.themeIndex);
            for (let i = 0; i < T.stars; i++) {
                g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
                const s = r() < 0.12 ? 2 : 1;
                g.fillRect(r() * VW, r() * VH * 0.6, s, s);
            }
            const S = T.sun;
            const glow = g.createRadialGradient(S.x, S.y, S.r * 0.4, S.x, S.y, S.r * 4.2);
            glow.addColorStop(0, S.glow + '0.55)'); glow.addColorStop(1, S.glow + '0)');
            g.fillStyle = glow; g.fillRect(0, 0, VW, VH);
            g.fillStyle = S.c; g.beginPath(); g.arc(S.x, S.y, S.r, 0, Math.PI * 2); g.fill();
            if (T.night) { // cratères de lune
                g.fillStyle = 'rgba(120,130,170,0.25)';
                [[-8, -6, 7], [9, 5, 9], [-2, 12, 4]].forEach(([dx, dy, rr]) => { g.beginPath(); g.arc(S.x + dx * S.r / 28, S.y + dy * S.r / 28, rr * S.r / 28, 0, Math.PI * 2); g.fill(); });
            }
        });

        const seed = 100 + this.themeIndex * 13;
        const fuji = makeLayer(1600, g => {
            const cx = 520, base = 330, top = 118;
            g.fillStyle = T.fuji;
            g.beginPath(); g.moveTo(cx - 430, base); g.quadraticCurveTo(cx - 150, base - 30, cx - 36, top + 6);
            g.lineTo(cx + 36, top + 6); g.quadraticCurveTo(cx + 150, base - 30, cx + 430, base); g.closePath(); g.fill();
            g.fillStyle = T.snow;
            g.beginPath(); g.moveTo(cx - 36, top + 6); g.lineTo(cx + 36, top + 6); g.quadraticCurveTo(cx + 62, top + 52, cx + 86, top + 86);
            g.lineTo(cx + 58, top + 70); g.lineTo(cx + 40, top + 96); g.lineTo(cx + 18, top + 66); g.lineTo(cx, top + 100); g.lineTo(cx - 20, top + 68);
            g.lineTo(cx - 42, top + 94); g.lineTo(cx - 62, top + 68); g.lineTo(cx - 88, top + 88); g.quadraticCurveTo(cx - 62, top + 52, cx - 36, top + 6); g.closePath(); g.fill();
            mist(g, 230, 340, T.mist);
        });
        const far = makeLayer(1200, g => {
            ridge(g, 1200, 285, [[26, 2], [14, 5], [7, 11]], seed + 1, T.far);
            mist(g, 250, 360, T.mist);
        });
        const mid = makeLayer(1400, g => {
            const h = ridge(g, 1400, 345, [[18, 2], [10, 6], [5, 13]], seed + 2, T.mid);
            const r = rng(seed + 3);
            [150, 640, 1090].forEach((x, i) => { if (i % 2 === 0) pagoda(g, x, h(x) + 6, 1.0 + r() * 0.2, T.mid); else torii(g, x, h(x) + 4, 1.1, T.mid); });
            for (let i = 0; i < 26; i++) { const x = r() * 1400; pine(g, x, h(x) + 6, 0.8 + r() * 0.7, T.mid); }
            mist(g, 330, 410, T.mist);
        });
        const near = makeLayer(1000, g => {
            const r = rng(seed + 4);
            const dark = T.bamboo, light = T.night ? 'rgba(120,200,190,0.22)' : 'rgba(190,240,170,0.25)';
            for (let i = 0; i < 9; i++) {
                const x = 40 + i * 115 + r() * 40;
                bamboo(g, x, 40 + r() * 140, 412, 7 + r() * 4, dark, light);
            }
            [270, 780].forEach(x => stoneLantern(g, x, 412, 1.0, dark, T.night || this.themeIndex === 2));
        });
        this.layers = { fuji, far, mid, near };

        // vignette
        this.vignette = makeLayer(VW, g => {
            const gr = g.createRadialGradient(VW / 2, VH / 2, VH * 0.5, VW / 2, VH / 2, VW * 0.62);
            gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, T.night ? 'rgba(0,0,10,0.5)' : 'rgba(30,10,20,0.28)');
            g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
        });

        if (!this.clouds.length) {
            const r = rng(55);
            for (let i = 0; i < 6; i++) this.clouds.push({ x: r() * 1000, y: 28 + r() * 110, s: 0.7 + r() * 0.9, v: 0.08 + r() * 0.12 });
            for (let i = 0; i < 28; i++) this.petals.push(this.newPetal(true));
        }
    },

    newPetal(anywhere) {
        return { x: anywhere ? Math.random() * VW : VW + 10, y: anywhere ? Math.random() * VH : -10 - Math.random() * 60,
                 vx: -0.6 - Math.random() * 1.2, vy: 0.5 + Math.random() * 0.8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.1,
                 s: 2.5 + Math.random() * 3, ph: Math.random() * 6 };
    },

    update() {
        this.clouds.forEach(c => { c.x += c.v; });
        this.petals.forEach((p, i) => {
            p.x += p.vx + Math.sin(state.tick * 0.03 + p.ph) * 0.4; p.y += p.vy; p.rot += p.vr;
            if (p.x < -12 || p.y > VH + 12) this.petals[i] = this.newPetal(false);
        });
    },

    drawLayer(L, cam, factor) {
        const off = -((cam * factor) % L.tileW);
        for (let x = off; x < VW; x += L.tileW) ctx.drawImage(L.c, x, 0, L.tileW + 1, VH);
    },

    draw(cam) {
        ctx.drawImage(this.sky.c, 0, 0, VW, VH);
        const T = this.theme;
        // nuages
        ctx.fillStyle = T.cloud;
        this.clouds.forEach(c => {
            const span = VW + 400;
            const x = (((c.x - cam * 0.03) % span) + span) % span - 200, y = c.y, s = c.s;
            ctx.beginPath();
            ctx.ellipse(x, y + 8 * s, 46 * s, 12 * s, 0, 0, Math.PI * 2);
            ctx.arc(x - 18 * s, y, 15 * s, 0, Math.PI * 2); ctx.arc(x + 4 * s, y - 8 * s, 20 * s, 0, Math.PI * 2); ctx.arc(x + 24 * s, y, 14 * s, 0, Math.PI * 2);
            ctx.fill();
        });
        this.drawLayer(this.layers.fuji, cam, 0.06);
        this.drawLayer(this.layers.far, cam, 0.12);
        this.drawLayer(this.layers.mid, cam, 0.25);
        this.drawLayer(this.layers.near, cam, 0.5);
    },

    drawPetals() {
        ctx.fillStyle = this.theme.petal;
        this.petals.forEach(p => {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        });
    },

    drawVignette() { ctx.drawImage(this.vignette.c, 0, 0, VW, VH); }
};

// ---------------------------------------------------------------- Particules
function emitBurst(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = (o.speed || 3) * (0.3 + Math.random() * 0.9);
        state.particles.push({
            x, y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0) - (o.up || 0),
            life: (o.life || 30) * (0.6 + Math.random() * 0.6), max: o.life || 30,
            size: (o.size || 3) * (0.6 + Math.random() * 0.8),
            color: Array.isArray(o.color) ? pick(o.color) : (o.color || '#fff'), grav: o.grav === undefined ? 0.12 : o.grav
        });
    }
}

function updateParticles() {
    const ps = state.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life--;
        if (p.life <= 0) ps.splice(i, 1);
    }
}

function drawParticles() {
    state.particles.forEach(p => {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x - state.cameraX, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- Frame
function renderFrame() {
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    ctx.clearRect(0, 0, VW, VH);
    Background.draw(state.cameraX);

    if (state.mode === 'title' || state.mode === 'win') {
        drawPlatforms();
        Background.drawPetals(); Background.drawVignette();
        return;
    }
    if (!state.ninja) return;

    ctx.save();
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    drawPlatforms();
    drawBoss(state.boss);
    drawCage();
    state.stars.forEach(drawStar);
    state.puzzles.forEach(drawScroll);
    state.shurikens.forEach(drawShuriken);
    state.fireballs.forEach(drawFireball);
    drawNinja(state.ninja);
    drawParticles();
    ctx.restore();

    Background.drawPetals();
    Background.drawVignette();
}
