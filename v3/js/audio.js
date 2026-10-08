'use strict';

let audioCtx = null;
let muted = false;

function initAudio() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function setMuted(m) { muted = m; }

function playSound(freq, type, duration, vol = 0.1) {
    if (!audioCtx || muted || audioCtx.state !== 'running') return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* audio indisponible */ }
}

const sounds = {
    jump: () => playSound(400, 'square', 0.2),
    star: () => playSound(880, 'sine', 0.15, 0.2),
    hit: () => playSound(150, 'sawtooth', 0.3),
    shoot: () => playSound(1200, 'sine', 0.1, 0.05),
    tap: () => playSound(800, 'sine', 0.03, 0.03),
    toggle: on => playSound(on ? 600 : 400, 'sine', 0.1, 0.05),
    puzzleWin: () => {
        playSound(523, 'sine', 0.1, 0.2);
        setTimeout(() => playSound(659, 'sine', 0.1, 0.2), 100);
        setTimeout(() => playSound(783, 'sine', 0.3, 0.2), 200);
    },
    puzzleDraw: () => {
        playSound(440, 'triangle', 0.15, 0.2);
        setTimeout(() => playSound(494, 'triangle', 0.25, 0.2), 130);
    },
    puzzleFail: () => {
        playSound(200, 'sawtooth', 0.2, 0.2);
        setTimeout(() => playSound(150, 'sawtooth', 0.4, 0.2), 150);
    },
    bossFree: () => {
        if (!audioCtx || muted || audioCtx.state !== 'running') return;
        const now = audioCtx.currentTime;
        [80, 120, 64].forEach(f => {
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f, now);
            osc.frequency.exponentialRampToValueAtTime(f / 2, now + 1.2);
            gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(now + 1.2);
        });
    },
    levelUp: () => {
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playSound(f, 'triangle', 0.25, 0.18), i * 110));
    },

    // --- Cinématique de fin
    blip: pitch => playSound(pitch * (0.94 + Math.random() * 0.12), 'square', 0.045, 0.035),
    whoosh: () => playNoise(0.45, 0.12, 900, 0.8),
    clang: () => {
        playNoise(0.25, 0.25, 3200, 1.2);
        playSound(880, 'square', 0.25, 0.12); playSound(1320, 'triangle', 0.5, 0.1);
    },
    crack: () => { playNoise(0.18, 0.3, 1800, 1.5); playSound(180, 'sawtooth', 0.12, 0.15); },
    poof: () => playNoise(0.5, 0.18, 500, 0.7),
    wind: () => playNoise(2.4, 0.1, 420, 0.5),
    gong: () => { playSound(98, 'sine', 2.4, 0.3); playSound(147, 'sine', 2, 0.15); playSound(196.5, 'triangle', 1.6, 0.06); },
    boom: () => { playSound(70, 'sine', 0.5, 0.4); playNoise(0.3, 0.2, 200, 0.6); },
    firework: () => {
        playSound(1500, 'sine', 0.35, 0.05);
        setTimeout(() => { playNoise(0.35, 0.22, 1400, 0.7); playSound(110, 'sine', 0.3, 0.3); }, 380);
    },
    roar: () => {
        [90, 135, 70].forEach(f => playSound(f, 'sawtooth', 0.9, 0.22));
        playNoise(0.8, 0.12, 300, 0.6);
    },
    laugh: () => {
        [196, 175, 196, 165, 147].forEach((f, i) => setTimeout(() => playSound(f, 'sawtooth', 0.2, 0.16), i * 230));
    },
    sting: () => { playSound(55, 'sawtooth', 1.8, 0.22); playSound(58, 'sawtooth', 1.8, 0.22); playSound(466, 'sine', 1.2, 0.07); },
    cheer: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playSound(f, 'triangle', 0.2, 0.12), i * 70))
};

// Bruit filtré (vent, souffle, choc) : un tampon de bruit blanc passé dans un filtre passe-bande
function playNoise(duration, vol, freq, q) {
    if (!audioCtx || muted || audioCtx.state !== 'running') return;
    try {
        const len = Math.ceil(audioCtx.sampleRate * duration);
        const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = q;
        const gain = audioCtx.createGain(); const now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(vol, now + duration * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        src.start(); src.stop(now + duration);
    } catch (e) { /* audio indisponible */ }
}

// Musique de fin : une ambiance par scène. Les intervalles sont suivis pour pouvoir être arrêtés.
const PENTA = [440, 493, 523, 587, 659, 783, 880];
const END_MOODS = {
    joie:  { every: 400, play(s) { playSound(pick(PENTA), 'triangle', 0.8, 0.15); if (s % 4 === 0) playSound(110, 'sine', 1.0, 0.1); } },
    fete:  { every: 230, play(s) {
        playSound(pick(PENTA), 'triangle', 0.35, 0.11);
        if (s % 4 === 0) playSound(82, 'sine', 0.3, 0.3);
        if (s % 2 === 1) playSound(260, 'square', 0.04, 0.03);
    } },
    calme: { every: 950, play(s) {
        const n = [392, 440, 523, 587, 659];
        playSound(n[(s * 2 + (s % 3)) % n.length], 'sine', 1.7, 0.09);
        if (s % 4 === 0) playSound(98, 'sine', 2.6, 0.07);
    } },
    tension: { every: 520, play(s) {
        playSound(55, 'sawtooth', 0.9, 0.06);
        if (s % 2 === 0) playSound(60, 'sine', 0.18, 0.3);
        if (s % 4 === 3) playSound(pick([415, 466, 622]), 'sine', 1.4, 0.04);
    } },
    ombre: { every: 700, play(s) {
        playSound(46, 'sawtooth', 1.2, 0.08); playSound(65, 'sawtooth', 1.2, 0.05);
        if (s % 4 === 3) playSound(pick([415, 622]), 'sine', 1.5, 0.04);
    } }
};
let endMusicInterval = null;
let endMood = null;
let clapsInterval = null;

function setEndMood(name) {
    if (endMood === name) return;
    clearInterval(endMusicInterval); endMusicInterval = null; endMood = name;
    const m = END_MOODS[name];
    if (!m) return;
    let step = 0;
    endMusicInterval = setInterval(() => m.play(step++), m.every);
}

function playClaps() {
    if (clapsInterval) return;
    clapsInterval = setInterval(() => playSound(Math.random() * 200 + 400, 'triangle', 0.05, 0.05), 200);
}

function stopClaps() { clearInterval(clapsInterval); clapsInterval = null; }

function stopEndAudio() {
    clearInterval(endMusicInterval); stopClaps();
    endMusicInterval = endMood = null;
}
