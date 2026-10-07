'use strict';

// ---------------------------------------------------------------------------
// Briques communes aux énigmes
// ---------------------------------------------------------------------------

// Clavier numérique. q = { html, answer, figure?, suffix?, noEq? }
function buildNumeric(body, q, finish) {
    const suffix = q.suffix ? ' ' + q.suffix : '';
    body.innerHTML = `
        <div class="question ${q.small ? 'small' : ''}">${q.html}${q.noEq ? '' : ' <span class="eq">= ?</span>'}</div>
        ${q.figure ? `<div class="fig-wrap">${q.figure}</div>` : ''}
        <div class="answer-box" id="num-display"></div>
        <div class="feedback" id="num-feedback"></div>
        <div class="numpad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-val="${n}">${n}</button>`).join('')}
            <button class="key key-del" id="num-del" aria-label="Effacer">⌫</button>
            <button class="key" data-val="0">0</button>
            <button class="key key-ok" id="num-ok">OK</button>
        </div>`;
    const display = body.querySelector('#num-display');
    const feedback = body.querySelector('#num-feedback');
    let input = '', locked = false;

    const refresh = () => { display.textContent = input ? input + suffix : ''; };
    const add = d => { if (locked || input.length >= 4) return; input += d; refresh(); sounds.tap(); };
    const del = () => { if (locked) return; input = input.slice(0, -1); refresh(); };
    const validate = () => {
        if (locked || input === '') return;
        locked = true;
        const ok = parseInt(input, 10) === q.answer;
        UI.cardFeedback(ok);
        if (ok) { sounds.puzzleWin(); feedback.textContent = 'Bravo !'; setTimeout(() => finish('win'), 800); }
        else { sounds.puzzleFail(); feedback.textContent = `La réponse était ${q.answer}${suffix}`; setTimeout(() => finish('lose'), 1800); }
    };

    body.querySelectorAll('.key[data-val]').forEach(b => b.onclick = () => add(b.dataset.val));
    body.querySelector('#num-del').onclick = del;
    body.querySelector('#num-ok').onclick = validate;
    UI.modalKeys = e => {
        if (/^[0-9]$/.test(e.key)) add(e.key);
        else if (e.key === 'Backspace') del();
        else if (e.key === 'Enter') validate();
    };
}

// Choix multiples.
// cfg = { question, figure?, choices: [{ html, correct? }], cols?, cls?, small?, win?, reveal? }
function buildChoices(body, cfg, finish) {
    const list = cfg.choices;
    body.innerHTML = `
        <div class="question ${cfg.small ? 'small' : ''}">${cfg.question}</div>
        ${cfg.figure ? `<div class="fig-wrap">${cfg.figure}</div>` : ''}
        <div class="feedback"></div>
        <div class="choices cols-${cfg.cols || 2} ${cfg.cls || ''}">${list.map((c, i) => `<button class="choice" data-i="${i}">${c.html}</button>`).join('')}</div>`;
    const feedback = body.querySelector('.feedback');
    const buttons = [...body.querySelectorAll('.choice')];
    let locked = false;

    const choose = i => {
        if (locked) return;
        locked = true;
        const ok = !!list[i].correct;
        buttons[i].classList.add(ok ? 'right' : 'wrong');
        if (!ok) buttons[list.findIndex(c => c.correct)].classList.add('right');
        UI.cardFeedback(ok);
        feedback.innerHTML = ok ? (cfg.win || 'Bravo !') : (cfg.reveal || 'Pas tout à fait…');
        if (ok) { sounds.puzzleWin(); setTimeout(() => finish('win'), 900); }
        else { sounds.puzzleFail(); setTimeout(() => finish('lose'), 2200); }
    };
    buttons.forEach((b, i) => { b.onclick = () => choose(i); });
    UI.modalKeys = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= list.length) choose(n - 1); };
}

// Mélange la bonne réponse avec de mauvaises réponses (HTML)
function mixChoices(correct, wrongs) {
    return shuffle([{ html: correct, correct: true }, ...wrongs.map(html => ({ html }))]);
}

// n éléments distincts tirés dans pool, en excluant `exclude`
function pickDistinct(pool, n, exclude = []) {
    return shuffle([...new Set(pool)].filter(x => !exclude.includes(x))).slice(0, n);
}

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

// Évite de reposer deux fois de suite la même question : appelle make() jusqu'à obtenir une clé différente
function noRepeat(holder, make) {
    let q, guard = 0;
    do { q = make(); guard++; } while (q.key === holder.last && guard < 30);
    holder.last = q.key;
    return q;
}
