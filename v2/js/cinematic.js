'use strict';

const Cinematic = {
    timers: [],
    petalTimer: null,

    at(ms, fn) { this.timers.push(setTimeout(fn, ms)); },

    start() {
        const root = $('final-cinematic');
        root.classList.remove('hidden');
        playEndMusic();
        const hero = $('cine-hero'), cage = $('cine-cage'), friend = $('cine-friend');
        const royalty = $('cine-royalty'), villagers = $('cine-villagers'), overlay = $('cine-overlay');

        this.at(100, () => { hero.style.left = '58%'; hero.classList.add('bounce'); });
        this.at(1500, () => {
            hero.classList.remove('bounce'); cage.textContent = '💥';
            this.at(500, () => {
                cage.style.opacity = '0';
                friend.style.transform = 'translateX(-60%)';
                friend.textContent = '🥷✨';
                $('cine-friend-cage').classList.add('freed');
                playSound(600, 'sine', 0.5);
            });
        });
        this.at(3000, () => {
            royalty.style.opacity = '1'; villagers.style.opacity = '1';
            document.querySelectorAll('.villager').forEach(v => v.classList.add('bounce'));
            playClaps();
        });
        this.at(6000, () => {
            hero.style.transform = 'scale(1.2)';
            friend.style.transform = 'scale(1.2) translateX(-60%)';
            overlay.style.opacity = '1';
            $('final-card').style.transform = 'scale(1)';
            overlay.style.pointerEvents = 'auto';
            this.petalTimer = setInterval(() => {
                const petal = document.createElement('div');
                petal.className = 'sakura';
                petal.style.left = Math.random() * 100 + '%';
                petal.style.width = petal.style.height = (Math.random() * 10 + 5) + 'px';
                petal.style.animationDuration = (Math.random() * 3 + 2) + 's';
                petal.style.opacity = Math.random() * 0.6 + 0.4;
                root.appendChild(petal);
                setTimeout(() => petal.remove(), 5000);
            }, 100);
        });
    },

    stop() {
        this.timers.forEach(clearTimeout); this.timers = [];
        clearInterval(this.petalTimer); this.petalTimer = null;
        stopEndAudio();
    }
};
