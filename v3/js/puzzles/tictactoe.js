'use strict';

// Le joueur est « O » (il commence), l'ordinateur est « X »
const TicTacToe = {
    LINES: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]],
    // probabilité que l'ordi voie un coup gagnant / un blocage
    skill: { 1: 0.35, 2: 0.5, 3: 1, 4: 1, 5: 1 },

    // 'O' | 'X' | 'draw' | null
    winner(b) {
        for (const [a, c, d] of this.LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
        return b.every(Boolean) ? 'draw' : null;
    },

    winLine(b) { return this.LINES.find(([a, c, d]) => b[a] && b[a] === b[c] && b[a] === b[d]) || null; },

    // Case complétant une ligne de `who`, ou -1
    completing(b, who) {
        for (const line of this.LINES) {
            const vals = line.map(i => b[i]);
            if (vals.filter(v => v === who).length === 2 && vals.includes(null)) return line[vals.indexOf(null)];
        }
        return -1;
    },

    minimax(b, turn) {
        const w = this.winner(b);
        if (w === 'X') return 1; if (w === 'O') return -1; if (w === 'draw') return 0;
        let best = turn === 'X' ? -2 : 2;
        for (let i = 0; i < 9; i++) {
            if (b[i]) continue;
            b[i] = turn;
            const s = this.minimax(b, turn === 'X' ? 'O' : 'X');
            b[i] = null;
            best = turn === 'X' ? Math.max(best, s) : Math.min(best, s);
        }
        return best;
    },

    bestMove(b) {
        let best = -2, moves = [];
        for (let i = 0; i < 9; i++) {
            if (b[i]) continue;
            b[i] = 'X'; const s = this.minimax(b, 'O'); b[i] = null;
            if (s > best) { best = s; moves = [i]; } else if (s === best) moves.push(i);
        }
        return pick(moves);
    },

    aiMove(b, level) {
        const L = clamp(level, 1, 5);
        const empty = b.map((v, i) => v ? -1 : i).filter(i => i >= 0);
        if (L >= 5) return this.bestMove(b);
        if (Math.random() < this.skill[L]) {
            const win = this.completing(b, 'X'); if (win >= 0) return win;
            const block = this.completing(b, 'O'); if (block >= 0) return block;
        }
        if (L === 4) {
            if (!b[4]) return 4;
            const corners = [0, 2, 6, 8].filter(i => !b[i]); if (corners.length) return pick(corners);
        }
        return pick(empty);
    },

    // Vérifie que l'IA de niveau 5 ne perd jamais : renvoie le nombre de défaites (doit être 0)
    selfTest() {
        let losses = 0;
        const play = (b, turn) => {
            const w = this.winner(b);
            if (w) { if (w === 'O') losses++; return; }
            if (turn === 'O') { for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = 'O'; play(b, 'X'); b[i] = null; } }
            else { const m = this.bestMove(b); b[m] = 'X'; play(b, 'O'); b[m] = null; }
        };
        play(Array(9).fill(null), 'O');
        return losses;
    },

    start(body, level, finish) {
        const board = Array(9).fill(null);
        let over = false, turn = 'O';
        const O = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="28" class="mk-o"/></svg>';
        const X = '<svg viewBox="0 0 100 100"><path d="M24 24 L76 76 M76 24 L24 76" class="mk-x"/></svg>';

        body.innerHTML = `
            <div class="question small">Aligne 3 symboles <span class="legend">Toi : ${O}</span></div>
            <div class="ttt" id="ttt">${board.map((_, i) => `<button class="cell" data-i="${i}" aria-label="Case ${i + 1}"></button>`).join('')}</div>
            <div class="feedback" id="ttt-status">À toi de jouer !</div>`;
        const cells = body.querySelectorAll('.cell');
        const status = body.querySelector('#ttt-status');

        const mark = (i, who) => {
            board[i] = who; cells[i].innerHTML = who === 'O' ? O : X; cells[i].disabled = true; cells[i].classList.add('pop');
            playSound(who === 'O' ? 700 : 450, 'triangle', 0.1, 0.12);
        };

        const check = () => {
            const w = this.winner(board);
            if (!w) return false;
            over = true;
            const line = this.winLine(board);
            if (line) line.forEach(i => cells[i].classList.add('win-cell'));
            if (w === 'O') { status.textContent = 'Victoire !'; UI.cardFeedback(true); sounds.puzzleWin(); setTimeout(() => finish('win'), 1400); }
            else if (w === 'draw') { status.textContent = 'Match nul : bien joué !'; sounds.puzzleDraw(); setTimeout(() => finish('draw'), 1400); }
            else { status.textContent = 'Le Shinobi a gagné… retente !'; UI.cardFeedback(false); sounds.puzzleFail(); setTimeout(() => finish('lose'), 1800); }
            return true;
        };

        const play = i => {
            if (over || turn !== 'O' || board[i]) return;
            mark(i, 'O');
            if (check()) return;
            turn = 'X'; status.textContent = 'Le Shinobi réfléchit…';
            setTimeout(() => {
                if (over) return;
                mark(this.aiMove(board, level), 'X');
                if (check()) return;
                turn = 'O'; status.textContent = 'À toi de jouer !';
            }, 550);
        };

        cells.forEach((c, i) => c.onclick = () => play(i));
        UI.modalKeys = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 9) play(n - 1); };
    }
};
