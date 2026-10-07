'use strict';

// ---------------------------------------------------------------- Flux de jeu
function startGame() {
    initAudio();
    const lvl = parseInt(PARAMS.get('level'), 10);
    state.level = lvl >= 1 && lvl <= CFG.maxLevel ? lvl : 1;
    state.lives = CFG.maxLives;
    Puzzles.setEnabled(UI.selectedTypes());   // choix du menu (mémorisé), ou ?types= pour le debug
    $('start-screen').classList.add('hidden');
    $('setup-screen').classList.add('hidden');
    UI.showHUD(true);
    initLevel();
    state.mode = 'play';
}

function openPuzzle(p) {
    state.mode = 'puzzle'; state.currentPuzzle = p; state.keys = {};
    Puzzles.open(p.type, state.level, closePuzzle);
}

function closePuzzle(result) {
    const p = state.currentPuzzle, n = state.ninja;
    if (result === 'win' || result === 'draw') {
        state.score += result === 'win' ? 20 : 10;
        p.solved = true;
        emitBurst(p.x + 20, p.y + 20, 22, { color: ['#ffe27a', '#fff3b0', '#6be28a', '#f2b84b'], speed: 4, life: 36, size: 3 });
    } else {
        // le ninja est repoussé du côté d'où il venait
        n.x = clamp(n.x + (n.x < p.x ? -120 : 120), 0, CFG.levelWidth - 100);
    }
    state.mode = 'play';
    UI.updateHUD();
}

function nextLevel() {
    if (state.mode === 'transition') return;
    state.mode = 'transition'; sounds.levelUp();
    const el = $('shuriken-transition');
    el.classList.add('animate');
    setTimeout(() => {
        if (state.level < CFG.maxLevel) { state.level++; initLevel(); state.mode = 'play'; }
        else startWin();
    }, 750);
    setTimeout(() => el.classList.remove('animate'), 1500);
}

function startWin() {
    state.mode = 'win';
    Background.setTheme(1);
    UI.showHUD(false);
    $('mobile-controls').classList.remove('on');
    Cinematic.start();
}

function gameOver() {
    state.mode = 'gameover'; state.keys = {};
    UI.showGameOver();
}

// ---------------------------------------------------------------- Boucle (pas fixe à 60 Hz)
let lastTime = 0, acc = 0;

function stepOnce() {
    state.tick++;
    if (state.mode === 'play') {
        updateWorld();
        updateParticles();
        if (state.shake > 0) state.shake--;
    } else if (state.mode === 'title' || state.mode === 'win') {
        state.cameraX = 1100 - 1100 * Math.cos(state.tick * 0.0015);
    } else {
        updateParticles();
        if (state.shake > 0) state.shake--;
    }
    Background.update();
}

function loop(t) {
    requestAnimationFrame(loop);
    acc += Math.min(t - lastTime, 100); lastTime = t;
    while (acc >= CFG.stepMs) { stepOnce(); acc -= CFG.stepMs; }
    renderFrame();
}

// ---------------------------------------------------------------- Entrées
window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (state.mode === 'puzzle') {
        if (UI.modalKeys) {
            UI.modalKeys(e);
            if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace' || e.key.startsWith('Arrow')) e.preventDefault();
        }
        return;
    }
    const k = e.key.toLowerCase();
    state.keys[k] = true;
    if (state.mode === 'play' && [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (state.mode === 'title' && k === 'enter' && !$('start-screen').classList.contains('hidden')) startGame();
});
window.addEventListener('keyup', e => { state.keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { state.keys = {}; });

function setupControl(id, key) {
    const el = $(id);
    const up = () => { state.keys[key] = false; };
    el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ } state.keys[key] = true; });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, up));
    el.addEventListener('contextmenu', e => e.preventDefault());
}

// ---------------------------------------------------------------- Démarrage
function boot() {
    UI.init();
    state.platforms = [{ x: 0, y: CFG.groundY, w: CFG.levelWidth, h: 40 }];
    Background.setTheme(0);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    UI.buildSetup();
    $('btn-play').onclick = startGame;
    $('btn-setup').onclick = () => UI.showSetup(true);
    $('setup-done').onclick = () => UI.showSetup(false);
    $('btn-retry').onclick = () => { UI.hideGameOver(); state.lives = CFG.maxLives; initLevel(); state.mode = 'play'; };
    $('btn-menu').onclick = () => location.reload();
    $('btn-replay').onclick = () => { Cinematic.stop(); location.reload(); };

    const controls = $('mobile-controls'), toggle = $('toggle-controls-btn');
    const setControls = on => { controls.classList.toggle('on', on); toggle.classList.toggle('active', on); };
    setControls(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    toggle.onclick = () => { const on = !controls.classList.contains('on'); setControls(on); sounds.toggle(on); };

    $('btn-mute').onclick = e => { setMuted(!muted); e.currentTarget.textContent = muted ? '🔇' : '🔊'; if (!muted) sounds.toggle(true); };

    // Les boutons ne gardent pas le focus (sinon Espace les déclencherait de nouveau)
    document.addEventListener('click', e => { const b = e.target.closest('button'); if (b) b.blur(); });

    setupControl('btn-left', 'left'); setupControl('btn-right', 'right');
    setupControl('btn-jump', 'jump'); setupControl('btn-shoot', 'shoot');

    lastTime = performance.now();
    requestAnimationFrame(loop);
    if (PARAMS.get('autostart')) startGame();   // ex. ?autostart=1&level=3&types=heure,suite
}

// Si le démarrage échoue (typiquement : anciens fichiers gardés en cache après une mise à jour), on le dit clairement
try {
    boot();
} catch (err) {
    console.error(err);
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;inset:auto 12px 12px 12px;z-index:999;padding:14px 16px;border-radius:14px;background:#fff7e6;color:#2b2a33;font:700 15px/1.4 sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5);text-align:center';
    msg.innerHTML = 'Le jeu n’a pas pu démarrer : une ancienne version est peut-être en mémoire.<br>Recharge la page sans le cache (Ctrl + Maj + R, ou Cmd + Maj + R sur Mac).';
    document.body.appendChild(msg);
}
