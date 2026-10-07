'use strict';

// Dimensions virtuelles du monde (le canvas est mis à l'échelle de l'écran)
const VW = 800;
const VH = 450;

const CFG = {
    gravity: 0.6,
    jumpForce: -14,
    speed: 5,
    levelWidth: 3000,
    groundY: 410,
    dragonMaxHP: 3,
    targetScore: 100,
    puzzlesPerLevel: 5,
    maxLevel: 5,
    maxLives: 3,
    maxErrors: 10,
    stepMs: 1000 / 60
};

// Paramètres de debug : ?level=3&puzzle=morpion&autostart=1
const PARAMS = new URLSearchParams(location.search);

const state = {
    mode: 'title', // title | play | puzzle | transition | gameover | win
    level: 1, score: 0, lives: CFG.maxLives, cameraX: 0, tick: 0, shake: 0,
    keys: {},
    stars: [], puzzles: [], shurikens: [], fireballs: [], platforms: [], particles: [],
    ninja: null, boss: null, cage: null, shurikenCooldown: 0, currentPuzzle: null
};

// Raccourcis utilitaires
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
