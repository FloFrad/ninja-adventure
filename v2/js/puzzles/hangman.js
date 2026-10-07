'use strict';

const WORD_BANK = [
    { hint: 'Le Japon', words: 'NINJA SAMURAI KATANA SHURIKEN DOJO SENSEI KIMONO SUSHI RAMEN TEMPLE SAKURA TORII BAMBOU ORIGAMI TOKYO KYOTO OSAKA GEISHA TATAMI MANGA KARATE JUDO AIKIDO HAIKU PAGODE ONIGIRI WASABI TEMPURA MOCHI BENTO FUJI ZEN SHOGUN KUNAI NUNCHAKU SUMO' },
    { hint: 'Un animal', words: 'DRAGON PANDA TIGRE SINGE CHAT RENARD CORBEAU GRUE CARPE TORTUE LAPIN DAUPHIN LION HIBOU SERPENT ELEPHANT GIRAFE PAPILLON ESCARGOT HERISSON CROCODILE GRENOUILLE LIBELLULE CIGOGNE FOURMI ABEILLE CHEVAL LOUP OURS AIGLE KOALA ZEBRE PHOQUE CHEVRE POULE CANARD CRABE REQUIN BALEINE PIEUVRE' },
    { hint: 'La nature', words: 'MONTAGNE FORET RIVIERE CASCADE NUAGE ORAGE SOLEIL LUNE ETOILE VOLCAN JARDIN CERISIER FLEUR PLUIE NEIGE VENT OCEAN ROCHER ARBRE FEUILLE LAC PRAIRIE BROUILLARD TONNERRE ECLAIR CIEL SABLE VAGUE RUISSEAU CAVERNE' },
    { hint: 'Quelque chose à manger', words: 'RIZ POMME FRAISE BANANE GATEAU FROMAGE CITRON ORANGE CERISE CHOCOLAT SOUPE BISCUIT CREPE TOMATE CAROTTE RAISIN MELON POIRE PECHE BONBON PIZZA SALADE CONFITURE YAOURT' },
    { hint: 'Un objet', words: 'SABRE ARC FLECHE MASQUE BOUCLIER CAPE LANTERNE EVENTAIL TAMBOUR CLOCHE PARCHEMIN PINCEAU CORDE CLEF COFFRE BOUSSOLE CARTE BATEAU ECHELLE MARTEAU TORCHE CHAPEAU BOTTE' },
    { hint: 'Un mot de ninja', words: 'COURAGE FORCE SAGESSE HONNEUR SILENCE OMBRE ESPRIT VICTOIRE AVENTURE TRESOR MYSTERE SECRET AMITIE PATIENCE BRAVOURE HEROS LEGENDE AGILITE VITESSE CALME RESPECT DISCIPLINE EQUILIBRE MAITRE COMBAT VOIE RITUEL' }
];

const AZERTY_ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];

const Hangman = {
    entries: WORD_BANK.flatMap(c => c.words.split(' ').map(w => ({ w, hint: c.hint }))),
    used: [],
    // Longueur visée selon le niveau (adaptée au CE1)
    lengths: { 1: [3, 5], 2: [4, 6], 3: [5, 7], 4: [5, 8], 5: [6, 9] },

    pickWord(level) {
        let free = this.entries.filter(e => !this.used.includes(e.w));
        if (!free.length) { this.used = []; free = this.entries; }
        const [lo, hi] = this.lengths[clamp(level, 1, 5)];
        const fit = free.filter(e => e.w.length >= lo && e.w.length <= hi);
        const e = pick(fit.length ? fit : free);
        this.used.push(e.w);
        return e;
    },

    start(body, level, finish) {
        const entry = this.pickWord(level);
        const word = entry.w;
        const guessed = [];
        let errors = 0, locked = false;

        body.innerHTML = `
            <div class="hint-line">Indice : <b>${entry.hint}</b></div>
            <div class="word" id="hg-word"></div>
            <div class="errors" id="hg-errors"></div>
            <div class="feedback" id="hg-solution"></div>
            <div class="kbd" id="hg-kbd">${AZERTY_ROWS.map(r => `<div class="kbd-row">${[...r].map(l => `<button class="kkey" data-l="${l}">${l}</button>`).join('')}</div>`).join('')}</div>`;
        const wordEl = body.querySelector('#hg-word');
        const errEl = body.querySelector('#hg-errors');
        const solEl = body.querySelector('#hg-solution');
        const keys = {};
        body.querySelectorAll('.kkey').forEach(b => { keys[b.dataset.l] = b; b.onclick = () => guess(b.dataset.l); });

        const render = (reveal = false) => {
            wordEl.innerHTML = [...word].map(l => {
                const shown = guessed.includes(l);
                return `<span class="tile ${shown ? 'found' : ''} ${reveal && !shown ? 'missed' : ''}">${shown || reveal ? l : ''}</span>`;
            }).join('');
            errEl.innerHTML = Array.from({ length: CFG.maxErrors }, (_, i) => `<i class="${i < errors ? 'on' : ''}"></i>`).join('') + `<span>${errors} / ${CFG.maxErrors}</span>`;
        };

        function guess(l) {
            if (locked || guessed.includes(l) || keys[l].disabled) return;
            keys[l].disabled = true;
            if (word.includes(l)) { guessed.push(l); keys[l].classList.add('hit'); playSound(900, 'sine', 0.05); }
            else { errors++; keys[l].classList.add('miss'); playSound(100, 'sawtooth', 0.1); }
            render();
            const win = [...word].every(c => guessed.includes(c));
            if (win || errors >= CFG.maxErrors) {
                locked = true;
                UI.cardFeedback(win);
                if (win) { sounds.puzzleWin(); setTimeout(() => finish('win'), 1000); }
                else {
                    sounds.puzzleFail(); render(true);
                    solEl.textContent = `Solution : ${word}`;
                    setTimeout(() => finish('lose'), 2500);
                }
            }
        }

        UI.modalKeys = e => {
            const l = e.key.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
            if (/^[A-Z]$/.test(l)) guess(l);
        };
        render();
    }
};
