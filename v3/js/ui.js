'use strict';

const $ = id => document.getElementById(id);

const LANTERN_SVG = `<svg viewBox="0 0 40 56" class="lantern"><rect x="15" y="0" width="10" height="7" rx="2" fill="#3a2a1d"/>
<rect x="9" y="5" width="22" height="6" rx="2" fill="#2a1f16"/><ellipse cx="20" cy="30" rx="16" ry="20" fill="url(#lantern-grad)"/>
<path d="M8 22 Q20 28 32 22 M5 32 Q20 40 35 32 M8 42 Q20 48 32 42" stroke="#7a1a1f" stroke-width="1.6" fill="none" opacity=".7"/>
<rect x="9" y="47" width="22" height="6" rx="2" fill="#2a1f16"/><path d="M20 53v3" stroke="#d6a43a" stroke-width="2"/>
<ellipse cx="14" cy="22" rx="3.5" ry="6" fill="#fff" opacity=".28"/></svg>`;

const UI = {
    modalKeys: null,
    bannerTimer: null,

    init() {
        $('lives').innerHTML = Array.from({ length: CFG.maxLives }, () => `<span class="life">${LANTERN_SVG}</span>`).join('');
    },

    updateHUD() {
        $('score-val').textContent = state.score;
        $('level-val').textContent = state.level;
        $('score-fill').style.width = clamp(state.score / CFG.targetScore * 100, 0, 100) + '%';
        $('score-fill').parentElement.classList.toggle('full', state.score >= CFG.targetScore);
        document.querySelectorAll('#lives .life').forEach((el, i) => el.classList.toggle('off', i >= state.lives));
    },

    setObjective(freed) {
        $('objective').textContent = freed ? 'Le dragon est libéré ! Saute dessus ou lance des shurikens' : 'Gagne 100 points pour libérer le dragon';
        $('hud').classList.toggle('boss', freed);
    },

    banner(title, sub) {
        $('banner-title').textContent = title; $('banner-sub').textContent = sub;
        const b = $('banner');
        b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    },

    flash(kind) {
        const f = $('flash');
        f.className = ''; void f.offsetWidth; f.className = 'on ' + kind;
    },

    // Fenêtre d'énigme : renvoie le conteneur dans lequel l'énigme se construit
    openModal(meta) {
        $('modal-icon').textContent = meta.icon;
        $('modal-title').textContent = meta.title;
        $('modal-sub').textContent = meta.sub;
        const body = $('modal-body');
        body.innerHTML = '';
        const card = $('modal-card');
        card.classList.remove('ok', 'ko');
        $('modal').classList.remove('hidden');
        card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
        return body;
    },

    closeModal() { UI.modalKeys = null; $('modal').classList.add('hidden'); },

    cardFeedback(ok) {
        const card = $('modal-card');
        card.classList.remove('ok', 'ko'); void card.offsetWidth;
        card.classList.add(ok ? 'ok' : 'ko');
    },

    // ---------------------------------------------------------- Menu de choix des énigmes
    STORAGE_KEY: 'ninja-v3-types',

    savedSelection() {
        const fromUrl = PARAMS.get('types');
        if (fromUrl) return fromUrl.split(',').filter(id => PUZZLE_BY_ID[id]);
        try {
            const raw = JSON.parse(localStorage.getItem(UI.STORAGE_KEY));
            if (Array.isArray(raw)) return raw.filter(id => PUZZLE_BY_ID[id]);
        } catch (e) { /* stockage indisponible */ }
        return PUZZLES.map(p => p.id);
    },

    buildSetup() {
        const selected = new Set(UI.savedSelection());
        $('setup-groups').innerHTML = CATEGORIES.map(cat => `
            <section class="grp" data-cat="${cat.id}">
                <div class="grp-head">
                    <h3>${cat.icon} ${cat.name}</h3>
                    <button class="btn-mini" data-toggle-cat="${cat.id}">Tout / Rien</button>
                </div>
                <div class="opts">${PUZZLES.filter(p => p.cat === cat.id).map(p => `
                    <label class="opt">
                        <input type="checkbox" value="${p.id}" ${selected.has(p.id) ? 'checked' : ''}>
                        <span class="opt-card">
                            <span class="opt-ico">${p.icon}</span>
                            <span class="opt-txt"><b>${p.label}</b><small>${p.desc}</small></span>
                            <span class="opt-check" aria-hidden="true">✓</span>
                        </span>
                    </label>`).join('')}
                </div>
            </section>`).join('');
        const boxes = () => [...document.querySelectorAll('#setup-groups input')];
        const update = () => {
            const n = boxes().filter(b => b.checked).length;
            $('setup-count').textContent = `${n} / ${PUZZLES.length} types choisis`;
            $('setup-start').disabled = n === 0;
        };
        boxes().forEach(b => b.addEventListener('change', () => { sounds.tap(); update(); }));
        document.querySelectorAll('[data-toggle-cat]').forEach(btn => btn.onclick = () => {
            const group = boxes().filter(b => PUZZLE_BY_ID[b.value].cat === btn.dataset.toggleCat);
            const all = group.every(b => b.checked);
            group.forEach(b => { b.checked = !all; });
            update();
        });
        $('setup-all').onclick = () => { boxes().forEach(b => { b.checked = true; }); update(); };
        $('setup-none').onclick = () => { boxes().forEach(b => { b.checked = false; }); update(); };
        update();
    },

    selectedTypes() { return [...document.querySelectorAll('#setup-groups input')].filter(b => b.checked).map(b => b.value); },

    saveSelection(ids) { try { localStorage.setItem(UI.STORAGE_KEY, JSON.stringify(ids)); } catch (e) { /* ignoré */ } },

    showSetup(on) {
        $('start-screen').classList.toggle('hidden', on);
        $('setup-screen').classList.toggle('hidden', !on);
        if (on) $('setup-screen').scrollTop = 0;
    },

    showGameOver() { $('gameover').classList.remove('hidden'); },
    hideGameOver() { $('gameover').classList.add('hidden'); },

    showHUD(on) { $('hud').classList.toggle('hidden', !on); }
};

// Notation fractionnaire empilée
function fracHTML(n, d) {
    return `<span class="frac"><span class="frac-n">${n}</span><span class="frac-d">${d}</span></span>`;
}
