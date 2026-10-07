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
    }
};

// Musique de fin et applaudissements : les intervalles sont suivis pour pouvoir être arrêtés
let endMusicInterval = null;
let clapsInterval = null;

function playEndMusic() {
    if (endMusicInterval) return;
    const melody = [440, 493, 523, 587, 659, 783, 880];
    let step = 0;
    endMusicInterval = setInterval(() => {
        playSound(pick(melody), 'triangle', 0.8, 0.15);
        if (step % 4 === 0) playSound(110, 'sine', 1.0, 0.1);
        step++;
    }, 400);
}

function playClaps() {
    if (clapsInterval) return;
    clapsInterval = setInterval(() => playSound(Math.random() * 200 + 400, 'triangle', 0.05, 0.05), 200);
}

function stopEndAudio() {
    clearInterval(endMusicInterval); clearInterval(clapsInterval);
    endMusicInterval = clapsInterval = null;
}
