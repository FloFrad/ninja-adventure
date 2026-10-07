'use strict';

// ---------------------------------------------------------------- Entités
class Ninja {
    constructor() {
        this.x = 100; this.y = 350; this.w = 40; this.h = 60; this.vx = 0; this.vy = 0;
        this.grounded = true; this.frame = 0; this.facing = 1; this.invul = 0; this.squash = 0; this.shootAnim = 0;
    }

    update() {
        if (state.mode !== 'play') return;
        const K = state.keys;
        const left = K.arrowleft || K.left || K.a || K.q;
        const right = K.arrowright || K.right || K.d;
        if (left && !right) { this.vx = -CFG.speed; this.facing = -1; this.frame++; }
        else if (right && !left) { this.vx = CFG.speed; this.facing = 1; this.frame++; }
        else this.vx = 0;

        if ((K.arrowup || K.jump || K.w || K.z) && this.grounded) {
            this.vy = CFG.jumpForce; this.grounded = false; sounds.jump();
            emitBurst(this.x + 20, this.y + 60, 6, { color: '#e8dcc0', speed: 1.6, life: 18, size: 2.5, grav: 0.02 });
        }
        if ((K[' '] || K.shoot) && state.shurikenCooldown <= 0) {
            state.shurikens.push({ x: this.x + (this.facing === 1 ? 40 : -10), y: this.y + 20, vx: this.facing * 10, angle: 0 });
            state.shurikenCooldown = 20; this.shootAnim = 8; sounds.shoot();
        }

        const wasAir = !this.grounded, fallSpeed = this.vy;
        this.vy += CFG.gravity; this.x += this.vx; this.y += this.vy;
        this.x = clamp(this.x, 0, CFG.levelWidth - 100);
        this.grounded = false;
        state.platforms.forEach(p => {
            if (this.x + this.w > p.x && this.x < p.x + p.w && this.y + this.h >= p.y && this.y + this.h <= p.y + 20 && this.vy >= 0) {
                this.y = p.y - this.h; this.vy = 0; this.grounded = true;
            }
        });
        if (!state.boss.freed) {
            const c = state.cage;
            if (this.x + this.w > c.x && this.x < c.x + c.w && this.y + this.h >= c.y && this.y + this.h <= c.y + 20 && this.vy >= 0) {
                this.y = c.y - this.h; this.vy = 0; this.grounded = true;
            }
        }
        if (this.y > 350) { this.y = 350; this.vy = 0; this.grounded = true; }

        if (this.grounded && wasAir && fallSpeed > 7) {
            this.squash = 8;
            emitBurst(this.x + 20, this.y + 60, 8, { color: '#e8dcc0', speed: 2, life: 20, size: 2.5, grav: 0.02 });
        }
        if (this.grounded && Math.abs(this.vx) > 0 && state.tick % 12 === 0) {
            emitBurst(this.x + 20 - this.facing * 8, this.y + 60, 2, { color: '#e8dcc0', speed: 0.8, life: 16, size: 2, grav: 0 });
        }
        if (this.invul > 0) this.invul--;
        if (this.squash > 0) this.squash--;
        if (this.shootAnim > 0) this.shootAnim--;
    }
}

class Dragon {
    constructor() {
        this.x = 2585; this.y = 325; this.w = 80; this.h = 80; this.hp = CFG.dragonMaxHP;
        this.freed = false; this.dir = 1; this.attackTimer = 0; this.hitCd = 0; this.charging = false;
    }

    fireRate() { return 180 - state.level * 25; }

    update() {
        if (state.mode !== 'play') return;
        if (this.hitCd > 0) this.hitCd--;
        if (!this.freed) {
            if (state.score >= CFG.targetScore) {
                this.freed = true; sounds.bossFree(); state.shake = 20;
                emitBurst(state.cage.x + 75, state.cage.y + 50, 30, { color: ['#3a3d4e', '#8b90a8', '#f2b84b'], speed: 5, life: 40, size: 3.5 });
                UI.setObjective(true);
            }
            return;
        }
        this.x += this.dir * (1.5 + state.level * 0.4);
        if (this.x < 2400 || this.x > 2850) this.dir *= -1;
        this.attackTimer++;
        this.charging = this.attackTimer > this.fireRate() - 25;
        if (this.attackTimer > this.fireRate()) {
            const speed = 3 + state.level * 0.5;
            const toLeft = state.ninja.x < this.x;
            state.fireballs.push({ x: this.x + 40 + (toLeft ? -30 : 30), y: this.y + 28, vx: toLeft ? -speed : speed, vy: 0 });
            this.attackTimer = 0; this.charging = false;
        }
    }

    hurt() {
        if (this.hitCd > 0) return false;
        this.hp--; this.hitCd = 25; sounds.hit(); state.shake = 8;
        emitBurst(this.x + 40, this.y + 30, 14, { color: ['#ffd27a', '#ff8a3d', '#fff'], speed: 4, life: 28, size: 3 });
        return true;
    }
}

// ---------------------------------------------------------------- Niveau
function initLevel() {
    state.score = 0; state.stars = []; state.puzzles = []; state.platforms = []; state.shurikens = []; state.fireballs = []; state.particles = [];
    state.ninja = new Ninja(); state.boss = new Dragon(); state.cameraX = 0; state.shurikenCooldown = 0; state.shake = 0;

    for (let i = 0; i < 15; i++) state.stars.push({ x: 300 + i * 160, y: 150 + Math.random() * 150, collected: false, ph: Math.random() * 6 });
    const types = Puzzles.plan(state.level);
    types.forEach((type, i) => state.puzzles.push({ x: 450 + i * 430, y: 340, type, solved: false }));
    state.platforms.push({ x: 0, y: CFG.groundY, w: CFG.levelWidth, h: 40 });
    for (let i = 0; i < 10; i++) state.platforms.push({ x: 300 + i * 220, y: 300 - (i % 3) * 40, w: 120, h: 20 });
    state.cage = { x: 2550, y: 310, w: 150, h: 100 };

    Background.setTheme(state.level - 1);
    UI.updateHUD();
    UI.setObjective(false);
    UI.banner(`Niveau ${state.level}`, THEMES[state.level - 1].name);
}

function updateWorld() {
    state.ninja.update();
    state.boss.update();
    state.cameraX = clamp(state.ninja.x - 300, 0, CFG.levelWidth - VW);

    for (let i = state.shurikens.length - 1; i >= 0; i--) {
        const s = state.shurikens[i];
        s.x += s.vx; s.angle += 0.5;
        if (Math.abs(s.x - state.ninja.x) > 700) state.shurikens.splice(i, 1);
    }
    for (let i = state.fireballs.length - 1; i >= 0; i--) {
        const f = state.fireballs[i];
        f.x += f.vx;
        if (state.tick % 3 === 0) emitBurst(f.x, f.y, 1, { color: ['#ff9a3d', '#ffd27a'], speed: 0.6, life: 16, size: 3, grav: -0.02 });
        if (Math.abs(f.x - state.ninja.x) > 900) state.fireballs.splice(i, 1);
    }
    if (state.shurikenCooldown > 0) state.shurikenCooldown--;
    checkCollisions();
}

function overlap(n, x, y, w, h) { return n.x < x + w && n.x + n.w > x && n.y < y + h && n.y + n.h > y; }

function checkCollisions() {
    if (state.mode !== 'play') return;
    const n = state.ninja, b = state.boss;

    state.stars.forEach(s => {
        if (!s.collected && overlap(n, s.x, s.y, 30, 30)) {
            s.collected = true; state.score += 5; sounds.star(); UI.updateHUD();
            emitBurst(s.x + 15, s.y + 15, 10, { color: ['#ffe27a', '#fff3b0', '#f2b84b'], speed: 3, life: 24, size: 2.6, grav: 0.05 });
        }
    });
    for (const p of state.puzzles) {
        if (!p.solved && overlap(n, p.x, p.y, 40, 40)) { openPuzzle(p); return; }
    }
    if (!b.freed) return;

    if (overlap(n, b.x, b.y, 80, 80)) {
        if (n.vy > 0 && (n.y + n.h) < (b.y + 50)) { if (b.hurt()) n.vy = -12; }
        else if (n.invul === 0) takeDamage();
    }
    for (let i = state.fireballs.length - 1; i >= 0; i--) {
        const f = state.fireballs[i];
        if (n.invul === 0 && overlap(n, f.x - 10, f.y - 10, 20, 20)) { state.fireballs.splice(i, 1); takeDamage(); }
    }
    for (let i = state.shurikens.length - 1; i >= 0; i--) {
        const s = state.shurikens[i];
        if (s.x < b.x + 80 && s.x > b.x && s.y < b.y + 80 && s.y > b.y) { state.shurikens.splice(i, 1); b.hurt(); }
    }
    if (b.hp <= 0) {
        emitBurst(b.x + 40, b.y + 40, 50, { color: ['#ffd27a', '#ff8a3d', '#fff', '#3fa34d'], speed: 6, life: 50, size: 4 });
        nextLevel();
    }
}

function takeDamage() {
    state.lives--; state.ninja.invul = 100; state.ninja.vy = -8; state.shake = 14;
    sounds.hit(); UI.flash('red'); UI.updateHUD();
    if (state.lives <= 0) gameOver();
}

// ---------------------------------------------------------------- Dessins
function groundUnder(n) {
    let gy = CFG.groundY;
    state.platforms.forEach(p => {
        if (p.y >= n.y + n.h - 6 && p.y < gy && n.x + n.w > p.x && n.x < p.x + p.w) gy = p.y;
    });
    return gy;
}

function groundPalette() {
    const i = Background.themeIndex;
    if (i >= 3) return { g1: '#2c6a5a', g2: '#1d4a40', d1: '#4a3a4f', d2: '#2c2236', wood1: '#5e4a6e', wood2: '#3a2c4a' };
    if (i === 2) return { g1: '#5a8a4a', g2: '#3a6a3f', d1: '#7a4a3a', d2: '#4a2a2f', wood1: '#8a5040', wood2: '#5a2f2c' };
    if (i === 0) return { g1: '#6bbf5a', g2: '#3f9a47', d1: '#8a5a38', d2: '#573820', wood1: '#a8683a', wood2: '#6e4020' };
    return { g1: '#58c25a', g2: '#2f9a45', d1: '#8a5a33', d2: '#5b3a1f', wood1: '#a8703c', wood2: '#6e4422' };
}

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

function drawPlatforms() {
    const cam = state.cameraX, P = groundPalette();
    state.platforms.forEach(p => {
        const x = p.x - cam;
        if (x > VW + 10 || x + p.w < -10) return;
        if (p.y >= CFG.groundY) {
            const gr = ctx.createLinearGradient(0, p.y, 0, VH);
            gr.addColorStop(0, P.d1); gr.addColorStop(1, P.d2);
            ctx.fillStyle = gr; ctx.fillRect(Math.max(0, x), p.y, Math.min(p.w, VW + 10), VH - p.y);
            // cailloux
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let xx = Math.floor(cam / 40) * 40; xx < cam + VW + 40; xx += 40) {
                const h = hash(xx);
                ctx.beginPath(); ctx.ellipse(xx - cam + h * 30, p.y + 14 + hash(xx + 3) * 20, 5 + h * 5, 3 + h * 2, 0, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = P.g2; ctx.fillRect(Math.max(0, x), p.y - 2, Math.min(p.w, VW + 10), 11);
            ctx.fillStyle = P.g1; ctx.fillRect(Math.max(0, x), p.y - 2, Math.min(p.w, VW + 10), 5);
            // brins d'herbe
            ctx.fillStyle = P.g1;
            for (let xx = Math.floor(cam / 9) * 9; xx < cam + VW + 9; xx += 9) {
                const h = hash(xx * 1.3), bh = 4 + h * 7, sway = Math.sin(state.tick * 0.05 + xx) * 1.5;
                ctx.beginPath(); ctx.moveTo(xx - cam - 2, p.y - 1); ctx.lineTo(xx - cam + sway, p.y - 1 - bh); ctx.lineTo(xx - cam + 2, p.y - 1); ctx.fill();
            }
        } else {
            // planche en bois suspendue
            ctx.fillStyle = 'rgba(0,0,0,0.16)';
            ctx.beginPath(); ctx.ellipse(x + p.w / 2, p.y + p.h + 8, p.w * 0.42, 5, 0, 0, Math.PI * 2); ctx.fill();
            const gr = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
            gr.addColorStop(0, P.wood1); gr.addColorStop(1, P.wood2);
            ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(x, p.y, p.w, p.h, 5); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5;
            for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * p.w / 4, p.y + 4); ctx.lineTo(x + i * p.w / 4, p.y + p.h); ctx.stroke(); }
            ctx.fillStyle = P.g1; ctx.beginPath(); ctx.roundRect(x - 2, p.y - 3, p.w + 4, 8, 4); ctx.fill();
            ctx.fillStyle = P.g2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + 8 + i * (p.w - 16) / 5, p.y + 6, 3, 0, Math.PI); ctx.fill(); }
            ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 6, p.y + 10, 2, 2); ctx.fillRect(x + p.w - 8, p.y + 10, 2, 2);
        }
    });
}

function drawStar(s) {
    if (s.collected) return;
    const x = s.x - state.cameraX + 15;
    if (x < -30 || x > VW + 30) return;
    const y = s.y + 15 + Math.sin(state.tick * 0.06 + s.ph) * 3;
    const pulse = 1 + Math.sin(state.tick * 0.1 + s.ph) * 0.1;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
    glow.addColorStop(0, 'rgba(255,226,122,0.55)'); glow.addColorStop(1, 'rgba(255,226,122,0)');
    ctx.fillStyle = glow; ctx.fillRect(x - 26, y - 26, 52, 52);
    ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 6 : 14, a = -Math.PI / 2 + i * Math.PI / 5;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    const gr = ctx.createLinearGradient(0, -14, 0, 14); gr.addColorStop(0, '#fff0a0'); gr.addColorStop(1, '#f2a93b');
    ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#b8731a'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
}

function drawScroll(p) {
    if (p.solved) return;
    const x = p.x - state.cameraX + 20;
    if (x < -40 || x > VW + 40) return;
    const st = PUZZLE_BY_ID[p.type], bob = Math.sin(state.tick * 0.07 + p.x) * 4, y = p.y + 20 + bob;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, p.y + 44, 16 - bob * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill();
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 34 + Math.sin(state.tick * 0.1) * 3);
    glow.addColorStop(0, st.color + 'aa'); glow.addColorStop(1, st.color + '00');
    ctx.fillStyle = glow; ctx.fillRect(x - 40, y - 40, 80, 80);
    // parchemin
    ctx.fillStyle = '#f7efdc'; ctx.beginPath(); ctx.roundRect(x - 15, y - 17, 30, 34, 3); ctx.fill();
    ctx.strokeStyle = '#b89a6a'; ctx.lineWidth = 1.2; ctx.stroke();
    // baguettes
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.roundRect(x - 19, y - 21, 38, 6, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x - 19, y + 15, 38, 6, 3); ctx.fill();
    ctx.fillStyle = st.color; ctx.fillRect(x - 15, y - 10, 30, 3); ctx.fillRect(x - 15, y + 8, 30, 3);
    ctx.fillStyle = '#2b2a33'; ctx.font = `800 ${st.glyph.length <= 2 ? 17 : st.glyph.length <= 3 ? 12 : 9}px Nunito, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st.glyph, x, y);
    // point d'exclamation
    ctx.fillStyle = st.color; ctx.beginPath(); ctx.arc(x + 16, y - 20 + Math.sin(state.tick * 0.15) * 2, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 11px Nunito, sans-serif'; ctx.fillText('!', x + 16, y - 20 + Math.sin(state.tick * 0.15) * 2 + 0.5);
}

function drawShuriken(s) {
    const x = s.x - state.cameraX;
    ctx.strokeStyle = 'rgba(220,230,255,0.28)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, s.y); ctx.lineTo(x - s.vx * 3, s.y); ctx.stroke();
    ctx.save(); ctx.translate(x, s.y); ctx.rotate(s.angle);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 13, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath();
    const gr = ctx.createLinearGradient(-12, -12, 12, 12); gr.addColorStop(0, '#f1f4fb'); gr.addColorStop(1, '#7c8499');
    ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = '#3b4154'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#2b2f40'; ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function drawFireball(f) {
    const x = f.x - state.cameraX, r = 13 + Math.sin(state.tick * 0.5) * 2;
    const gr = ctx.createRadialGradient(x, f.y, 1, x, f.y, r * 1.8);
    gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.3, 'rgba(255,200,80,0.95)');
    gr.addColorStop(0.65, 'rgba(255,100,30,0.6)'); gr.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, f.y, r * 1.8, 0, Math.PI * 2); ctx.fill();
}

function drawCage() {
    const b = state.boss, c = state.cage, cam = state.cameraX;
    if (b.freed) return;
    const x = c.x - cam;
    if (x > VW + 20 || x + c.w < -20) return;
    ctx.fillStyle = '#23263a'; ctx.beginPath(); ctx.roundRect(x - 6, c.y - 14, c.w + 12, 20, 5); ctx.fill();
    ctx.fillStyle = '#3a3e58'; ctx.fillRect(x - 6, c.y - 14, c.w + 12, 5);
    for (let i = 0; i < 6; i++) {
        const bx = x + i * 30;
        ctx.strokeStyle = '#1b1d2c'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(bx, c.y + 4); ctx.lineTo(bx, c.y + c.h); ctx.stroke();
        ctx.strokeStyle = '#7a809c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 1.5, c.y + 4); ctx.lineTo(bx - 1.5, c.y + c.h); ctx.stroke();
    }
    ctx.fillStyle = '#23263a'; ctx.beginPath(); ctx.roundRect(x - 8, c.y + c.h - 2, c.w + 16, 14, 4); ctx.fill();
    // sceau
    const sway = Math.sin(state.tick * 0.05) * 2;
    ctx.fillStyle = '#f7efdc'; ctx.fillRect(x + c.w / 2 - 12 + sway, c.y - 6, 24, 40);
    ctx.fillStyle = '#d63a3a'; ctx.font = '800 20px "Kaisei Decol", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('封', x + c.w / 2 + sway, c.y + 14);
}

function drawBoss(b) {
    const cam = state.cameraX, t = state.tick;
    const x = b.x - cam;
    if (x > VW + 90 || x < -120) return;
    const bob = Math.sin(t * 0.08) * (b.freed ? 3 : 1.2);
    const face = b.freed ? b.dir : -1;
    const flap = Math.sin(t * (b.freed ? 0.22 : 0.05));
    ctx.save();
    ctx.translate(x + 40, b.y + 40 + bob);
    if (face === -1) ctx.scale(-1, 1);
    if (b.hitCd > 0 && Math.floor(b.hitCd / 3) % 2 === 0) ctx.globalAlpha = 0.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // queue
    ctx.strokeStyle = '#2f8a46'; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(-24, 16); ctx.bezierCurveTo(-48, 26, -58 + Math.sin(t * 0.1) * 4, 2, -44, -14); ctx.stroke();
    ctx.fillStyle = '#d63a3a'; ctx.beginPath(); ctx.moveTo(-50, -10); ctx.lineTo(-40, -26); ctx.lineTo(-36, -8); ctx.closePath(); ctx.fill();
    // aile
    const wy = -32 - flap * 12;
    ctx.fillStyle = '#c8453a'; ctx.strokeStyle = '#7d1f1b'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-44, wy);
    ctx.quadraticCurveTo(-42, wy + 18, -31, wy + 20 - flap * 3); ctx.quadraticCurveTo(-29, wy + 28, -18, wy + 28 - flap * 3);
    ctx.quadraticCurveTo(-14, 4, -2, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-31, wy + 20 - flap * 3); ctx.moveTo(-2, -2); ctx.lineTo(-18, wy + 28 - flap * 3); ctx.stroke();
    // pattes
    ctx.fillStyle = '#2f8a46';
    ctx.beginPath(); ctx.ellipse(-14, 29, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(15, 30, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    [-8, -14, -20].forEach(dx => { ctx.beginPath(); ctx.moveTo(dx - 1, 35); ctx.lineTo(dx + 1, 40); ctx.lineTo(dx + 3, 35); ctx.fill(); });
    [21, 15, 9].forEach(dx => { ctx.beginPath(); ctx.moveTo(dx - 1, 36); ctx.lineTo(dx + 1, 41); ctx.lineTo(dx + 3, 36); ctx.fill(); });
    // corps
    const bg = ctx.createLinearGradient(0, -14, 0, 30); bg.addColorStop(0, '#5cc866'); bg.addColorStop(1, '#2f8a46');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 8, 29, 23, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4dc9a'; ctx.beginPath(); ctx.ellipse(7, 14, 17, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(160,120,50,0.45)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 0, 8 + i * 6); ctx.quadraticCurveTo(7, 12 + i * 6, 20, 8 + i * 6); ctx.stroke(); }
    // piques dorsales
    ctx.fillStyle = '#d63a3a';
    [-20, -10, 0, 10].forEach(sx => { const sy = 8 - 23 * Math.sqrt(1 - Math.pow(sx / 29, 2)); ctx.beginPath(); ctx.moveTo(sx - 4, sy + 2); ctx.lineTo(sx, sy - 8); ctx.lineTo(sx + 4, sy + 2); ctx.fill(); });
    // cou
    ctx.strokeStyle = '#3fa34d'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.quadraticCurveTo(26, -4, 28, -16); ctx.stroke();
    // tête
    const mouth = b.charging ? 1 : 0;
    ctx.fillStyle = '#2f8a46'; ctx.beginPath(); ctx.ellipse(38, -13 + mouth * 3, 12, 5 + mouth * 3, 0, 0, Math.PI * 2); ctx.fill();
    if (mouth) { ctx.fillStyle = '#7d1f1b'; ctx.beginPath(); ctx.ellipse(40, -15, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#4cb85a'; ctx.beginPath(); ctx.ellipse(34, -23, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(45, -20, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; [43, 48].forEach(tx => { ctx.beginPath(); ctx.moveTo(tx - 2, -15 - mouth * 2); ctx.lineTo(tx, -11 - mouth * 2); ctx.lineTo(tx + 2, -15 - mouth * 2); ctx.fill(); });
    ctx.fillStyle = '#e8d9a8'; // cornes
    ctx.beginPath(); ctx.moveTo(24, -30); ctx.lineTo(12, -46); ctx.lineTo(31, -33); ctx.fill();
    ctx.beginPath(); ctx.moveTo(31, -32); ctx.lineTo(24, -48); ctx.lineTo(37, -33); ctx.fill();
    ctx.fillStyle = '#1c2a1f'; ctx.beginPath(); ctx.arc(50, -23, 1.6, 0, Math.PI * 2); ctx.fill();
    if (b.freed) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(37, -27, 4.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f7c531'; ctx.beginPath(); ctx.arc(38, -27, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillRect(37.4, -30, 1.4, 6.5);
        ctx.strokeStyle = '#17331f'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(29, -34); ctx.lineTo(43, -29.5); ctx.stroke();
    } else {
        ctx.strokeStyle = '#17331f'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(37, -27, 4, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    }
    if (mouth) {
        const g = ctx.createRadialGradient(52, -15, 1, 52, -15, 16);
        g.addColorStop(0, 'rgba(255,230,120,0.9)'); g.addColorStop(1, 'rgba(255,100,20,0)');
        ctx.fillStyle = g; ctx.fillRect(34, -32, 36, 36);
    }
    ctx.restore();

    if (!b.freed) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '800 15px Nunito, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('z', x + 12, b.y - 4 - (t % 60) * 0.2); ctx.fillText('Z', x + 2, b.y - 16 - (t % 60) * 0.2);
    } else {
        const w = 70, bx = x + 5, by = b.y - 22;
        ctx.fillStyle = 'rgba(20,22,31,0.65)'; ctx.beginPath(); ctx.roundRect(bx - 2, by - 2, w + 4, 12, 6); ctx.fill();
        ctx.fillStyle = '#d63a3a'; ctx.beginPath(); ctx.roundRect(bx, by, Math.max(0, w * b.hp / CFG.dragonMaxHP), 8, 4); ctx.fill();
    }
}

function drawNinja(n) {
    const cam = state.cameraX, t = state.tick;
    const moving = Math.abs(n.vx) > 0.1, air = !n.grounded;
    const gy = groundUnder(n);
    const sh = clamp(1 - (gy - (n.y + n.h)) / 160, 0.3, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(n.x - cam + 20, gy + 2, 18 * sh, 4 * sh, 0, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(n.x - cam + 20, n.y + 30);
    if (n.invul % 10 > 5) ctx.globalAlpha = 0.35;
    let sy = 1 + Math.sin(t * 0.08) * 0.012;
    if (air) sy = 1 + clamp(-n.vy * 0.012, -0.1, 0.16);
    if (n.squash > 0) sy = 0.84;
    ctx.translate(0, 30); ctx.scale(n.facing / sy, sy); ctx.translate(0, -30);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const ph = n.frame * 0.3, leg = moving && !air ? Math.sin(ph) * 10 : 0;

    // katana dans le dos
    ctx.strokeStyle = '#3a2a1d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(10, -34); ctx.stroke();
    ctx.strokeStyle = '#d6a43a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(9, -30); ctx.lineTo(11, -37); ctx.stroke();

    // écharpe
    const sc = '#d63a3a';
    let px = -6, py = -13;
    for (let i = 1; i <= 6; i++) {
        const nx = px - (6 + Math.abs(n.vx) * 0.7);
        const ny = -13 + Math.sin(t * 0.2 + i * 0.8) * (1.5 + i * 0.5) + (air ? clamp(n.vy, -8, 8) * i * 0.45 : i * 0.9);
        ctx.strokeStyle = i % 2 ? sc : '#b02828'; ctx.lineWidth = 8 - i * 0.9;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
        px = nx; py = ny;
    }

    // jambes
    ctx.strokeStyle = '#1c2033'; ctx.lineWidth = 9;
    [-1, 1].forEach(side => {
        const lm = side === 1 ? leg : -leg;
        const fx = air ? side * 6 + (side === 1 ? 5 : -3) : side * 5 + lm;
        const fy = air ? (side === 1 ? 22 : 26) : 28 - Math.max(0, Math.cos(ph + (side === 1 ? 0 : Math.PI))) * (moving ? 4 : 0);
        ctx.beginPath(); ctx.moveTo(side * 5, 12); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = '#d63a3a'; ctx.fillRect(fx - 4.5, fy - 6, 9, 3);
    });

    // bras arrière
    const arm = moving && !air ? Math.cos(ph) * 9 : 0;
    ctx.strokeStyle = '#232842'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(-11 - arm, 6); ctx.stroke();
    // torse
    const tg = ctx.createLinearGradient(0, -14, 0, 14); tg.addColorStop(0, '#2d3456'); tg.addColorStop(1, '#171b2d');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(-13, -14, 26, 28, 6); ctx.fill();
    ctx.fillStyle = '#d63a3a'; ctx.fillRect(-13, 4, 26, 6);
    ctx.beginPath(); ctx.moveTo(-13, 6); ctx.lineTo(-20, 12 + Math.sin(t * 0.2) * 2); ctx.lineTo(-17, 7); ctx.closePath(); ctx.fill();
    // bras avant
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 7;
    const hx = n.shootAnim > 0 ? 27 : 9 + arm, hy = n.shootAnim > 0 ? -10 : 6;
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#f1c9a0'; ctx.beginPath(); ctx.arc(hx + (n.shootAnim > 0 ? 2 : 0), hy, 3.4, 0, Math.PI * 2); ctx.fill();

    // tête
    ctx.fillStyle = '#1c2033'; ctx.beginPath(); ctx.arc(0, -24, 12.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1c9a0'; ctx.beginPath(); ctx.roundRect(-9, -29, 20, 8, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-4, -27, 5, 4); ctx.fillRect(4, -27, 5, 4);
    ctx.fillStyle = '#111'; ctx.fillRect(-1, -26, 2.5, 3); ctx.fillRect(7, -26, 2.5, 3);
    ctx.strokeStyle = '#1c2033'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-5, -29); ctx.lineTo(1, -27.5); ctx.moveTo(4, -27.5); ctx.lineTo(10, -29.5); ctx.stroke();
    // bandeau
    ctx.fillStyle = '#d63a3a'; ctx.fillRect(-12.5, -34, 25, 5);
    ctx.fillStyle = '#c9d1e0'; ctx.beginPath(); ctx.roundRect(1, -34.5, 11, 6, 1.5); ctx.fill();
    ctx.fillStyle = '#5a6278'; ctx.fillRect(5.5, -33, 2, 3);
    ctx.strokeStyle = '#d63a3a'; ctx.lineWidth = 3;
    [0, 1].forEach(i => {
        ctx.beginPath(); ctx.moveTo(-12, -31.5);
        ctx.quadraticCurveTo(-20 - Math.abs(n.vx), -34 + Math.sin(t * 0.2 + i * 1.5) * 4 + i * 4, -29 - Math.abs(n.vx) * 1.5, -30 + Math.sin(t * 0.25 + i) * 5 + i * 6);
        ctx.stroke();
    });
    ctx.restore();
}
