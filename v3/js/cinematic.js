'use strict';

// Cinématique de fin : 4 scènes puis l'écran « À suivre… » (cliffhanger vers l'épisode 4).
//
// Tout est en DOM dans #final-cinematic (unité CSS --u = hauteur / 450, donc les coordonnées ci-dessous sont des pixels
// virtuels 800 × 450 comme dans le jeu). Les personnages et les décors viennent de cine-art.js. Le fond est le décor du jeu
// (canvas) : chaque scène choisit un thème de THEMES (aube, plein jour, crépuscule, nuit…).
//
// Le déroulé est un script `async` : chaque `await` attend un délai (`wait`), un déplacement (`go`) ou un appui du
// joueur (`say`). Tous les délais passent par `at` / `every` pour être annulés par `stop()` : une promesse annulée ne se
// résout jamais, donc le script s'arrête net.
//
// Histoire : Kaito libère Hana (le sceau 封 de la cage se brise et une fumée violette s'échappe), le village fête
// le héros (le roi lui offre un rouleau doré marqué du même sceau), puis la nuit le rouleau s'ouvre et libère Kage,
// le Maître de l'Ombre, qui annonce qu'il reste six sceaux. « À suivre… » dans Ninja Adventure 4.

const CAST = {
    kaito:  { name: 'Kaito',    color: '#d63a3a', pitch: 520 },
    hana:   { name: 'Hana',     color: '#2a9d8f', pitch: 700 },
    roi:    { name: 'Le Roi',   color: '#b9791a', pitch: 300, ay: 0.02 },
    reine:  { name: 'La Reine', color: '#e0558c', pitch: 640, ay: 0.02 },
    enfant: { name: 'Taro',     color: '#3fa34d', pitch: 860 },
    kage:   { name: 'Kage',     color: '#7a2fd0', pitch: 105, dark: true, ay: 0.04 }
};

const SEAL_X = 672;   // le sceau est accroché sur le côté de la cage, pour ne pas cacher Hana
const FW_COLORS = ['#ffe27a', '#ff7aa8', '#7ad7ff', '#9dff8a', '#ffb05c', '#d49aff'];

const Cinematic = {
    timers: [],
    intervals: [],
    gen: 0,
    els: {},
    pan: 0,
    typing: null,
    waiting: null,
    hints: 0,
    bound: false,
    petalTimer: null,
    fwTimer: null,
    speaker: null,

    // ------------------------------------------------------------ Outils de temps
    at(ms, fn) { const id = setTimeout(fn, ms); this.timers.push(id); return id; },
    every(ms, fn) { const id = setInterval(fn, ms); this.intervals.push(id); return id; },
    wait(ms) { return new Promise(res => this.at(ms, res)); },
    clearTimers() {
        this.timers.forEach(clearTimeout); this.timers = [];
        this.intervals.forEach(clearInterval); this.intervals = [];
        this.petalTimer = this.fwTimer = null;
    },

    // ------------------------------------------------------------ Démarrage / arrêt
    start(from = 0) {
        this.stop();
        const gen = ++this.gen;
        this.bind();
        const root = $('final-cinematic');
        root.classList.remove('hidden', 'bars', 'windy', 'finished');
        $('cine-end').classList.remove('on');
        const fade = $('cine-fade');
        fade.style.transition = 'none'; fade.classList.remove('clear'); void fade.offsetWidth; fade.style.transition = '';
        this.clearWorld();
        this.hints = 0;
        this.at(300, () => root.classList.add('bars'));
        this.story(from, gen);
    },

    stop() {
        this.gen++;
        this.clearTimers();
        this.typing = this.waiting = null;
        this.pan = 0;
        stopEndAudio();
        $('final-cinematic').classList.add('hidden');
        this.clearWorld();
    },

    // Appui du joueur (écran, Entrée, Espace, →) : termine la phrase en cours ou passe à la suivante
    advance() {
        if (this.typing) this.typing.finish();
        else if (this.waiting) this.waiting();
    },

    // « Passer » : on saute directement à l'écran « À suivre… »
    skip() {
        if ($('final-cinematic').classList.contains('finished')) return;
        this.gen++;
        this.clearTimers();
        this.typing = this.waiting = null;
        stopClaps();
        this.finale();
    },

    bind() {
        if (this.bound) return;
        this.bound = true;
        $('final-cinematic').addEventListener('pointerdown', e => {
            if (e.target.closest('button')) return;
            initAudio();
            this.advance();
        });
        $('cine-skip').onclick = () => this.skip();
        window.addEventListener('resize', () => {   // la bulle suit son personnage si la fenêtre change de taille
            if (this.speaker && !$('cine-balloon').classList.contains('hidden')) this.placeBalloon(this.speaker.el, this.speaker.cast);
        });
        $('btn-replay').onclick = () => { this.stop(); location.reload(); };
        $('btn-again').onclick = () => this.start();
        const stars = document.querySelector('#cine-end .end-stars');
        for (let i = 0; i < 46; i++) {
            const s = document.createElement('i');
            s.style.cssText = `left:${rand(2, 98)}%;top:${rand(2, 98)}%;--d:${(Math.random() * 3).toFixed(2)}s`;
            stars.appendChild(s);
        }
    },

    // Appelé à chaque pas de la boucle de jeu : le décor défile très lentement
    update() { state.cameraX = clamp(state.cameraX + this.pan, 0, 1900); },

    // ------------------------------------------------------------ Décor et acteurs
    clearWorld() {
        $('cine-world').innerHTML = ''; $('cine-fx').innerHTML = '';
        this.els = {};
        $('cine-balloon').classList.add('hidden');
        $('cine-glow').style.opacity = 0;
        $('cine-hint').classList.remove('on');
        $('cine-caption').classList.remove('on');
    },

    add(id, html, o = {}) {
        const el = document.createElement('div');
        el.className = 'cine-el ' + (o.cls || '');
        el.innerHTML = `<div class="fig-box">${html}</div>`;
        const set = (k, v) => { if (v !== undefined) el.style.setProperty(k, v); };
        set('--x', o.x); set('--w', o.w); set('--b', o.b); set('--y', o.y); set('--sc', o.sc); set('--fx', o.fx);
        el.style.setProperty('--z', o.z !== undefined ? o.z : Math.round(100 - (o.b === undefined ? 36 : o.b)));
        el.style.setProperty('--ph', '-' + (Math.random() * 3).toFixed(2) + 's');
        $('cine-world').appendChild(el);
        this.els[id] = el;
        return el;
    },

    // Personnage : kind = kaito | hana | roi | reine | ryu | kage | un villageois (paysan, cuisiniere, artiste, enfant, mamie)
    actor(id, kind, o = {}) {
        const el = this.add(id, Art.figure(kind), { ...o, cls: `fig fig-${kind} ${o.cls || ''}` });
        el.dataset.emo = o.emo || 'normal';
        if (o.curse) el.dataset.curse = '1';
        return el;
    },

    emo(id, e) { this.els[id].dataset.emo = e; },
    pose(id, cls, on = true) { this.els[id].classList.toggle(cls, on); },
    // Pose temporaire (saut, révérence…)
    once(id, cls, ms) { const el = this.els[id]; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); this.at(ms, () => el.classList.remove(cls)); },
    cheer(ids, on = true) { ids.forEach(id => this.pose(id, 'cheer', on)); },

    // Déplacement fluide vers x (et éventuellement une autre profondeur b) ; la promesse se résout à l'arrivée
    go(id, x, ms, gait = 'walk', b) {
        const el = this.els[id], cur = parseFloat(el.style.getPropertyValue('--x'));
        void el.offsetWidth;
        el.style.setProperty('--dur', ms + 'ms');
        if (x !== cur) el.style.setProperty('--fx', x < cur ? -1 : 1);
        if (gait) el.classList.add(gait);
        el.style.setProperty('--x', x);
        if (b !== undefined) el.style.setProperty('--b', b);
        return this.wait(ms).then(() => { if (gait) el.classList.remove(gait); });
    },
    face(id, dir) { this.els[id].style.setProperty('--fx', dir); },

    // ------------------------------------------------------------ Effets
    shake(long) { const c = $('cine-cam'); c.classList.remove('shake', 'shake-long'); void c.offsetWidth; c.classList.add(long ? 'shake-long' : 'shake'); },
    flash(ms = 120) {
        const f = $('cine-flash');
        f.classList.remove('fade'); f.classList.add('on');
        this.at(ms, () => { f.classList.add('fade'); f.classList.remove('on'); });
    },
    tint(color) { $('cine-tint').style.background = color; },
    glow(x, y, color, radius) {
        const g = $('cine-glow');
        g.style.background = `radial-gradient(circle at calc(var(--u) * ${x}) calc(var(--u) * ${y}), ${color}, transparent calc(var(--u) * ${radius}))`;
        g.style.opacity = 1;
    },
    // Place un élément de l'effet à des coordonnées virtuelles
    fx(cls, x, y, vars = {}) {
        const d = document.createElement('div');
        d.className = cls;
        d.style.left = `calc(var(--u) * ${x})`; d.style.top = `calc(var(--u) * ${y})`;
        Object.entries(vars).forEach(([k, v]) => d.style.setProperty(k, v));
        $('cine-fx').appendChild(d);
        return d;
    },
    puff(x, y, color, n = 3) {
        for (let i = 0; i < n; i++) {
            const d = this.fx('fx-puff', x + rand(-18, 18), y + rand(-10, 10), {
                '--c': color || 'rgba(120, 60, 190, .75)', '--dx': `calc(var(--u) * ${rand(-30, 30)})`, '--dy': `calc(var(--u) * ${rand(-70, -25)})`, '--sc': (1.3 + Math.random()).toFixed(2)
            });
            this.at(1700, () => d.remove());
        }
    },
    sparks(x, y, n = 10) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, r = rand(20, 55);
            const d = this.fx('fx-spark', x, y, { '--dx': `calc(var(--u) * ${(Math.cos(a) * r).toFixed(1)})`, '--dy': `calc(var(--u) * ${(Math.sin(a) * r).toFixed(1)})` });
            this.at(1000, () => d.remove());
        }
    },
    firework(x, y) {
        const col = pick(FW_COLORS), col2 = pick(FW_COLORS), n = 26, big = rand(64, 98);
        sounds.firework();
        const core = this.fx('fw-core', x, y); this.at(600, () => core.remove());
        for (let i = 0; i < n; i++) {   // deux anneaux : un grand, un petit d'une autre couleur
            const inner = i % 2 === 1, a = (i / n) * Math.PI * 2 + Math.random() * 0.15, r = big * (inner ? 0.5 : 1) * (0.85 + Math.random() * 0.25);
            const d = this.fx('fw-dot', x, y, { '--c': inner ? col2 : col, '--dx': `calc(var(--u) * ${(Math.cos(a) * r).toFixed(1)})`, '--dy': `calc(var(--u) * ${(Math.sin(a) * r).toFixed(1)})` });
            this.at(1500, () => d.remove());
        }
    },
    fireworks(on) {
        clearInterval(this.fwTimer); this.fwTimer = null;
        if (on) this.fwTimer = this.every(900, () => this.firework(rand(110, 700), rand(75, 200)));
    },
    petals(on) {
        clearInterval(this.petalTimer); this.petalTimer = null;
        if (!on) return;
        this.petalTimer = this.every(170, () => {
            const p = document.createElement('div');
            p.className = 'sakura';
            const s = rand(5, 13);
            p.style.cssText = `left:${rand(0, 100)}%;width:calc(var(--u) * ${s});height:calc(var(--u) * ${s});animation-duration:${(Math.random() * 3 + 2.5).toFixed(1)}s;opacity:${(Math.random() * 0.5 + 0.5).toFixed(2)}`;
            $('cine-fx').appendChild(p);
            this.at(6000, () => p.remove());
        });
    },
    caption(text, ms = 3200) {
        const c = $('cine-caption');
        c.textContent = text; c.classList.add('on');
        this.at(ms, () => c.classList.remove('on'));
    },
    hint() {
        if (this.hints++ >= 2) return;
        const h = $('cine-hint');
        $('cine-caption').classList.remove('on');   // même emplacement que la légende
        h.classList.add('on');
        this.at(3800, () => h.classList.remove('on'));
    },

    // ------------------------------------------------------------ Dialogues
    // Bulle au-dessus du personnage qui parle, texte tapé lettre par lettre, suite au toucher
    say(id, text, emo, name) {
        return new Promise(resolve => {
            const el = this.els[id], cast = CAST[id], b = $('cine-balloon');
            if (emo) this.emo(id, emo);
            b.className = cast.dark ? 'dark' : '';   // affiche aussi la bulle (retire « hidden ») et efface « ready »
            $('cine-name').textContent = name || cast.name;
            $('cine-name').style.setProperty('--c', cast.color);
            const chars = Array.from(text);
            const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
            const paint = n => { $('cine-text').innerHTML = esc(chars.slice(0, n).join('')) + '<span class="ghost">' + esc(chars.slice(n).join('')) + '</span>'; };
            paint(0);
            this.placeBalloon(el, cast);   // mesurée avec le texte complet (invisible) : la bulle ne change pas de taille en cours de frappe
            el.classList.add('talk');
            let n = 0, finished = false;
            const done = () => {
                if (finished) return;
                finished = true;
                this.typing = null;
                el.classList.remove('talk');
                b.classList.add('ready');
                this.hint();
                let used = false;
                const next = () => {
                    if (used) return;
                    used = true; this.waiting = null;
                    b.classList.add('hidden');
                    resolve();
                };
                this.waiting = next;
                this.at(7000 + chars.length * 110, next);   // si personne ne touche l'écran, l'histoire continue quand même
            };
            this.typing = { finish: () => { n = chars.length; paint(n); done(); } };
            const tick = () => {
                if (finished) return;
                if (n >= chars.length) return done();
                n++; paint(n);
                if (n % 2 === 0 && chars[n - 1].trim()) sounds.blip(cast.pitch);
                this.at(chars[n - 1] === ' ' ? 18 : 32, tick);
            };
            tick();
        });
    },

    placeBalloon(el, cast) {
        const b = $('cine-balloon'), rr = $('final-cinematic').getBoundingClientRect(), r = el.getBoundingClientRect();
        this.speaker = { el, cast };
        const u = rr.height / 450, bw = b.offsetWidth, bh = b.offsetHeight;
        const cx = r.left - rr.left + r.width * (cast.ax || 0.5);
        const left = clamp(cx, bw / 2 + 8 * u, rr.width - bw / 2 - 8 * u);
        b.style.left = left + 'px';
        b.style.top = Math.max(r.top - rr.top + r.height * (cast.ay === undefined ? 0.1 : cast.ay) - 14 * u, bh + $('cine-caption').offsetHeight + 4 * u) + 'px';
        b.style.setProperty('--tail', clamp(cx - (left - bw / 2), 24 * u, bw - 24 * u) + 'px');
    },

    // ------------------------------------------------------------ Changements de scène
    async fade(toBlack) { $('cine-fade').classList.toggle('clear', !toBlack); await this.wait(950); },

    // Prépare une scène derrière le fondu au noir (thème du décor, ambiance, acteurs) puis rouvre l'image
    async enter(o, build) {
        this.clearWorld();
        this.petals(false); this.fireworks(false);
        $('final-cinematic').classList.remove('windy');
        Background.setTheme(o.theme);
        state.cameraX = o.cam; this.pan = o.pan;
        this.tint(o.tint || 'transparent');
        build();
        setEndMood(o.music);
        await this.fade(false);
    },
    leave() { return this.fade(true); },

    async story(from, gen) {
        const scenes = [this.aube, this.village, this.fete, this.nuit];
        for (const scene of scenes.slice(from)) await scene.call(this);
        await this.finale();
    },

    // ============================================================ Scène 1 : l'aube, la cage de Hana
    async aube() {
        await this.enter({ theme: 0, cam: 380, pan: 0.12, tint: 'rgba(255, 165, 110, .12)', music: 'calme' }, () => {
            this.add('cageBack', Art.cageBack(), { x: 610, w: 200, b: 30, z: 20 });
            this.actor('hana', 'hana', { x: 610, w: 92, b: 56, sc: 0.72, emo: 'worry', z: 21, cls: 'caged' });
            this.add('cage', Art.cageFront(), { x: 610, w: 200, b: 30, z: 22, cls: 'cage' });
            this.add('sceau', Art.sceau(), { x: SEAL_X, w: 24, b: 98, z: 23 });
            this.actor('ryu', 'ryu', { x: 150, w: 230, b: 44, emo: 'sleep', cls: 'tired', curse: true });
            this.add('zzz', '<div class="zzz"><span style="--zd:0s">z</span><span style="--zd:.9s">Z</span><span style="--zd:1.8s">z</span></div>', { x: 236, w: 30, b: 152, z: 30 });
            this.actor('kaito', 'kaito', { x: -70, w: 92, b: 28 });
        });
        this.caption('Au lever du jour, le combat est terminé…', 3800);
        await this.wait(900);

        sounds.whoosh();
        await this.go('kaito', 400, 2300, 'run');
        await this.say('hana', 'Kaito ! Tu as battu Ryu !', 'happy');
        await this.say('kaito', 'Tiens bon, Hana ! Je te sors de là !', 'angry');

        // Kaito saute et frappe la cage
        await this.go('kaito', 500, 420, 'run');
        this.once('kaito', 'jump', 760);
        sounds.whoosh();
        await this.wait(380);
        this.flash(110); this.shake(); sounds.clang();
        this.els.cage.classList.add('open'); this.els.cageBack.classList.add('gone');
        this.sparks(610, 270, 14);
        this.emo('hana', 'shock');
        await this.wait(800);

        // Le sceau tombe et se brise : une fumée violette s'échappe (personne ne la remarque)
        const sceau = this.els.sceau;
        void sceau.offsetWidth;
        sceau.style.setProperty('--b', 28); sceau.classList.add('fall');
        this.els.hana.style.setProperty('--z', 40);
        this.emo('hana', 'happy');
        this.els.hana.style.setProperty('--sc', 1);
        const out = this.go('hana', 570, 1300, 'walk', 30);
        this.go('kaito', 470, 900, 'walk');
        await this.wait(700);
        sceau.remove();
        ['l', 'r'].forEach(side => this.add('sceau' + side, Art.sceau(), { x: SEAL_X, w: 24, b: 28, z: 23, cls: 'half-' + side }));
        void this.els.sceaul.offsetWidth;
        this.els.sceaul.classList.add('split'); this.els.sceaur.classList.add('split');
        sounds.crack();
        this.puff(SEAL_X, 410, 'rgba(130, 60, 200, .8)', 4);
        this.fx('fx-wisp', SEAL_X, 400);
        await out;
        await this.wait(500);

        await this.say('hana', 'Merci, Kaito ! Je savais que tu viendrais.', 'happy');
        await this.say('kaito', 'Un ninja n’abandonne jamais son ami !', 'happy');
        this.cheer(['kaito', 'hana']); sounds.cheer(); this.sparks(525, 330, 12);
        await this.wait(1500);
        this.cheer(['kaito', 'hana'], false);

        // Ryu se réveille, les yeux rouges… puis le mauvais sort se brise
        this.els.zzz.remove();
        this.pose('ryu', 'tired', false); this.emo('ryu', 'angry'); sounds.boom();
        this.emo('kaito', 'shock'); this.emo('hana', 'shock');
        this.once('kaito', 'hit', 500);
        await this.say('kaito', 'Attention ! Ryu se réveille !', 'shock');
        delete this.els.ryu.dataset.curse; this.emo('ryu', 'happy');
        this.sparks(205, 285, 12); sounds.puzzleWin();
        this.emo('kaito', 'normal'); this.emo('hana', 'happy');
        this.go('ryu', 290, 1700, 'walk');
        await this.wait(1900);
        await this.say('hana', 'Ses yeux sont redevenus dorés ! Il n’est plus méchant.', 'happy');
        await this.say('kaito', 'Rentrons au village, tout le monde nous attend !', 'happy');

        // Ils partent vers la droite
        this.go('kaito', 930, 3000, 'walk'); this.go('hana', 850, 3000, 'walk'); this.go('ryu', 760, 3000, 'walk');
        await this.wait(1700);
        await this.leave();
    },

    // ============================================================ Scène 2 : le retour au village
    async village() {
        const crowd = ['paysan', 'cuisiniere', 'artiste', 'mamie', 'enfant', 'roi', 'reine'];
        await this.enter({ theme: 1, cam: 700, pan: 0.15, tint: 'transparent', music: 'joie' }, () => {
            this.add('torii', Art.torii(), { x: 150, w: 230, b: 40, z: 3 });
            this.add('maison1', Art.maison(), { x: 470, w: 230, b: 50, z: 2 });
            this.add('maison2', Art.maison(), { x: 745, w: 220, b: 50, z: 2 });
            this.actor('paysan', 'paysan', { x: 440, w: 86, b: 60, emo: 'happy' });
            this.actor('cuisiniere', 'cuisiniere', { x: 520, w: 86, b: 66, emo: 'happy' });
            this.actor('artiste', 'artiste', { x: 610, w: 86, b: 64, emo: 'happy' });
            this.actor('mamie', 'mamie', { x: 705, w: 86, b: 60, emo: 'happy' });
            this.actor('enfant', 'enfant', { x: 770, w: 86, b: 30, sc: 0.78, emo: 'happy' });
            this.actor('roi', 'roi', { x: 560, w: 100, b: 30, emo: 'happy' });
            this.actor('reine', 'reine', { x: 662, w: 96, b: 30, emo: 'happy' });
            this.actor('ryu', 'ryu', { x: -270, w: 230, b: 40, emo: 'happy' });
            this.actor('hana', 'hana', { x: -150, w: 92, b: 30, emo: 'happy' });
            this.actor('kaito', 'kaito', { x: -60, w: 92, b: 24, emo: 'happy' });
        });
        this.caption('Le village accueille ses héros !', 3400);
        this.petals(true); playClaps(); sounds.cheer();
        this.cheer(crowd);
        await Promise.all([this.go('kaito', 330, 3500), this.go('hana', 238, 3500), this.go('ryu', 118, 3500)]);
        await this.wait(900);
        stopClaps();
        this.cheer(crowd.filter(id => id !== 'enfant'), false);

        await this.say('roi', 'Bravo, Kaito ! Tu as sauvé tout le village !', 'happy');
        await this.say('reine', 'Et notre petite Hana est revenue saine et sauve !', 'happy');
        this.once('hana', 'bow', 1500);
        await this.say('hana', 'Merci, Votre Majesté !', 'happy');
        await this.say('roi', 'Reçois ce rouleau doré. C’est un très vieux trésor du royaume.', 'happy');

        // Le roi offre le rouleau à Kaito
        this.add('rouleau', Art.rouleau(), { x: 540, w: 58, b: 86, z: 70, cls: 'shine' });
        sounds.puzzleWin(); this.sparks(540, 340, 10);
        await this.wait(600);
        this.els.rouleau.classList.add('fly');
        this.els.rouleau.style.setProperty('--x', 350); this.els.rouleau.style.setProperty('--b', 64);
        await this.wait(1200);
        this.once('kaito', 'bow', 1500);
        await this.say('kaito', 'Merci, Majesté ! Je le garderai précieusement.', 'happy');

        this.cheer(crowd); this.petals(true); sounds.cheer(); playClaps();
        await this.say('enfant', 'Hourra pour Kaito !', 'happy');
        await this.wait(700);
        stopClaps();
        await this.leave();
    },

    // ============================================================ Scène 3 : la fête du soir
    async fete() {
        const dancers = ['cuisiniere', 'artiste', 'paysan', 'enfant'];
        await this.enter({ theme: 2, cam: 250, pan: 0.2, tint: 'rgba(255, 110, 60, .07)', music: 'fete' }, () => {
            this.add('maison1', Art.maison(), { x: 120, w: 230, b: 50, z: 2, cls: 'lit' });
            this.add('maison2', Art.maison(), { x: 725, w: 230, b: 50, z: 2, cls: 'lit' });
            this.add('lanternes', Art.lanternes(9), { x: 400, w: 800, b: 318, z: 4 });
            this.add('lanternes2', Art.lanternes(6), { x: 420, w: 600, b: 292, z: 3 });
            this.actor('cuisiniere', 'cuisiniere', { x: 50, w: 86, b: 62, emo: 'happy' });
            this.actor('paysan', 'paysan', { x: 790, w: 86, b: 62, emo: 'happy' });
            this.actor('artiste', 'artiste', { x: 560, w: 86, b: 62, emo: 'happy' });
            this.actor('ryu', 'ryu', { x: 150, w: 230, b: 38, emo: 'happy' });
            this.actor('hana', 'hana', { x: 400, w: 92, b: 28, emo: 'happy' });
            this.actor('kaito', 'kaito', { x: 300, w: 92, b: 24, emo: 'happy' });
            this.actor('enfant', 'enfant', { x: 470, w: 86, b: 24, sc: 0.78, emo: 'happy' });
            this.actor('roi', 'roi', { x: 640, w: 100, b: 28, emo: 'happy' });
            this.actor('reine', 'reine', { x: 724, w: 96, b: 28, emo: 'happy' });
            this.add('rouleau', Art.rouleau(), { x: 350, w: 58, b: 64, z: 70 });
        });
        this.caption('Le soir, c’est la fête au village !', 3400);
        this.cheer(dancers); this.fireworks(true); this.petals(true);
        await this.wait(2600);
        await this.say('enfant', 'Regardez ! Des feux d’artifice !', 'happy');
        await this.say('kaito', 'Quelle belle fête !', 'happy');

        // Hana remarque le signe du rouleau
        this.fireworks(false); this.cheer(dancers, false); setEndMood('tension');
        this.emo('hana', 'worry'); this.emo('kaito', 'normal');
        this.els.rouleau.classList.add('hot'); sounds.sting();
        await this.say('hana', 'Kaito… regarde le rouleau. Son signe est le même que sur ma cage.', 'worry');
        await this.say('kaito', 'Quoi ?! Le même sceau que sur la cage ?', 'shock');
        this.els.rouleau.classList.remove('hot');

        setEndMood('fete'); this.emo('kaito', 'normal');
        this.cheer(dancers); this.fireworks(true); sounds.cheer();
        await this.say('roi', 'Allons, allons ! Ce soir, on danse !', 'happy');
        this.emo('hana', 'worry');
        for (let i = 0; i < 3; i++) { this.firework(rand(140, 660), rand(70, 180)); await this.wait(420); }
        await this.wait(1300);
        await this.leave();
    },

    // ============================================================ Scène 4 : la nuit, le rouleau s'ouvre
    async nuit() {
        await this.enter({ theme: 3, cam: 1000, pan: 0.08, tint: 'rgba(10, 14, 60, .2)', music: 'calme' }, () => {
            this.add('maison1', Art.maison(), { x: 100, w: 230, b: 50, z: 2, cls: 'night lit' });
            this.add('maison2', Art.maison(), { x: 720, w: 230, b: 50, z: 2, cls: 'night' });
            this.add('lanternes', Art.lanternes(9), { x: 400, w: 800, b: 318, z: 4, cls: 'night' });
            this.add('redmoon', '', { x: 600, y: 52, cls: 'top redmoon', z: 3 });
            this.actor('ryu', 'ryu', { x: 140, w: 230, b: 38, emo: 'sleep', cls: 'tired' });
            this.actor('kaito', 'kaito', { x: 300, w: 92, b: 24, emo: 'happy' });
            this.actor('hana', 'hana', { x: 500, w: 92, b: 28, emo: 'happy', fx: -1 });
            this.add('feu', Art.feu(), { x: 400, w: 96, b: 34, z: 20 });
            this.add('rouleau', Art.rouleau(), { x: 445, w: 58, b: 22, z: 30 });
            this.glow(400, 360, 'rgba(255, 150, 60, .42)', 300);
        });
        this.caption('Cette nuit-là, tout est calme…', 3600);
        await this.wait(2000);
        await this.say('hana', 'Quelle journée ! Enfin la paix…', 'happy');
        await this.say('kaito', 'Oui. Plus aucun danger pour le village.', 'happy');
        await this.say('hana', 'Dis, Kaito… ce rouleau, tu crois que c’est vraiment un trésor ?', 'worry');

        // Le vent se lève, le feu s'éteint
        setEndMood('tension'); sounds.wind();
        $('final-cinematic').classList.add('windy'); this.petals(true);
        this.pose('ryu', 'tired', false); this.emo('ryu', 'angry'); sounds.boom();
        this.emo('kaito', 'worry'); this.emo('hana', 'worry');
        await this.wait(1900);
        this.els.feu.classList.add('out'); $('cine-glow').style.opacity = 0;
        this.puff(400, 380, 'rgba(160, 160, 175, .7)', 3); sounds.poof();
        this.tint('rgba(5, 8, 40, .34)');
        await this.wait(1100);
        this.els.redmoon.classList.add('on');
        this.emo('kaito', 'shock'); this.emo('hana', 'shock');
        const scroll = this.els.rouleau;
        scroll.classList.add('hot', 'fly');
        scroll.style.setProperty('--b', 235); scroll.style.setProperty('--x', 420);
        sounds.sting();
        await this.wait(1700);
        scroll.classList.add('spin');
        await this.say('hana', 'Kaito ! Le rouleau brille !', 'shock');
        this.emo('kaito', 'angry');
        await this.say('kaito', 'Reste derrière moi, Hana !', 'angry');

        // Le sceau du rouleau se brise : Kage apparaît dans un éclair
        sounds.crack(); await this.wait(350); sounds.crack();
        await this.wait(450);
        this.flash(900); this.shake(true); sounds.boom();
        await this.wait(500);
        Background.setTheme(4);
        ['--x:250', '--y:66', '--md:92'].forEach(kv => { const [k, v] = kv.split(':'); this.els.redmoon.style.setProperty(k, v); });
        this.tint('rgba(80, 0, 40, .42)');
        scroll.classList.remove('hot');
        this.puff(630, 330, 'rgba(110, 40, 190, .85)', 6); this.puff(400, 260, 'rgba(110, 40, 190, .8)', 4);
        this.actor('kage', 'kage', { x: 640, w: 150, b: 46, z: 80, cls: 'appear' });
        setEndMood('ombre'); sounds.sting();
        this.emo('kaito', 'angry'); this.emo('hana', 'shock'); this.pose('hana', 'scared');
        this.pose('ryu', 'tired', false); this.once('ryu', 'roar', 1900); this.emo('ryu', 'angry'); this.go('ryu', 190, 1200, 'walk');
        sounds.roar();
        await this.wait(2200);

        await this.say('kage', 'Merci, petit ninja… Tu as brisé le premier sceau.', null, '???');
        await this.say('kaito', 'Qui es-tu ?!', 'angry');
        await this.say('kage', 'Je suis Kage, le Maître de l’Ombre. Grâce à toi, je suis libre !');
        await this.say('hana', 'Libre ?!', 'shock');

        // Le rouleau vole jusqu'à la main de Kage
        this.pose('kage', 'reach');
        await this.wait(500);
        scroll.classList.remove('spin'); scroll.classList.add('fly');
        scroll.style.setProperty('--x', 548); scroll.style.setProperty('--b', 178);
        await this.wait(1250);
        await this.say('kage', 'Il reste six sceaux… et je les briserai tous.');
        sounds.laugh();
        await this.say('kage', 'Hou hou hou hou…');

        // Kage disparaît dans la fumée ; seuls ses yeux restent un instant dans le noir
        sounds.poof(); this.puff(640, 330, 'rgba(110, 40, 190, .85)', 6);
        this.pose('kage', 'vanish'); scroll.classList.add('gone');
        await this.wait(1300);
        this.els.kage.remove();
        this.tint('rgba(40, 0, 30, .55)');
        const eyes = this.add('yeux', '<div class="end-eyes-dark"><i></i><i></i></div>', { x: 640, y: 175, w: 70, cls: 'top', z: 90 });
        sounds.sting();
        await this.wait(1900);
        eyes.classList.add('gone');
        this.pose('hana', 'scared', false); this.emo('hana', 'worry');
        await this.say('kaito', 'Je te retrouverai, Kage !', 'angry');
        this.once('ryu', 'roar', 1900); sounds.roar(); this.shake();
        await this.wait(2300);
        await this.leave();
    },

    // ============================================================ « À suivre… »
    async finale() {
        const root = $('final-cinematic');
        root.classList.add('finished');
        $('cine-balloon').classList.add('hidden');
        $('cine-hint').classList.remove('on');
        this.pan = 0.05;
        setEndMood('ombre');
        $('cine-end').classList.add('on');
        this.at(900, () => sounds.gong());
    }
};
