'use strict';

// Labyrinthe : guider le ninja jusqu'au temple
const Maze = {
    size: { 1: [4, 3], 2: [5, 4], 3: [6, 4], 4: [7, 5], 5: [8, 5] },
    DIRS: { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] },
    OPP: { up: 'down', down: 'up', left: 'right', right: 'left' },

    // Génération par parcours en profondeur : walls[y][x] = { up, down, left, right } (true = mur)
    generate(cols, rows) {
        const walls = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ up: true, down: true, left: true, right: true })));
        const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
        const stack = [[0, 0]]; seen[0][0] = true;
        while (stack.length) {
            const [x, y] = stack[stack.length - 1];
            const next = shuffle(Object.entries(this.DIRS)).map(([d, [dx, dy]]) => [d, x + dx, y + dy])
                .filter(([, nx, ny]) => nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny][nx]);
            if (!next.length) { stack.pop(); continue; }
            const [d, nx, ny] = next[0];
            walls[y][x][d] = false; walls[ny][nx][this.OPP[d]] = false;
            seen[ny][nx] = true; stack.push([nx, ny]);
        }
        return walls;
    },

    shortest(walls, cols, rows) {
        const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
        dist[0][0] = 0; const q = [[0, 0]];
        while (q.length) {
            const [x, y] = q.shift();
            for (const [d, [dx, dy]] of Object.entries(this.DIRS)) {
                const nx = x + dx, ny = y + dy;
                if (!walls[y][x][d] && dist[ny][nx] < 0) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); }
            }
        }
        return dist[rows - 1][cols - 1];
    },

    svg(walls, cols, rows, pos, trail) {
        const C = 38, W = cols * C, H = rows * C;
        let out = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff7e6"/>`;
        trail.forEach(([x, y]) => { out += `<circle cx="${x * C + C / 2}" cy="${y * C + C / 2}" r="4" fill="#f2b84b" opacity=".8"/>`; });
        let lines = '';
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
            const w = walls[y][x], x0 = x * C, y0 = y * C;
            if (w.up) lines += `M${x0} ${y0}h${C}`;
            if (w.left) lines += `M${x0} ${y0}v${C}`;
            if (y === rows - 1 && w.down) lines += `M${x0} ${y0 + C}h${C}`;
            if (x === cols - 1 && w.right) lines += `M${x0 + C} ${y0}v${C}`;
        }
        out += `<path d="${lines}" stroke="#7a4a26" stroke-width="4" stroke-linecap="round" fill="none"/>`;
        out += `<text x="${(cols - 1) * C + C / 2}" y="${(rows - 1) * C + C / 2 + 1}" text-anchor="middle" dominant-baseline="central" font-size="26">🏯</text>`;
        out += `<text x="${pos[0] * C + C / 2}" y="${pos[1] * C + C / 2 + 1}" text-anchor="middle" dominant-baseline="central" font-size="26">🥷</text>`;
        return `<svg viewBox="-4 -4 ${W + 8} ${H + 8}" class="fig fig-maze">${out}</svg>`;
    },

    start(body, level, finish) {
        const [cols, rows] = this.size[clamp(level, 1, 5)];
        const walls = this.generate(cols, rows);
        const best = this.shortest(walls, cols, rows), limit = best * 2 + 6;
        let pos = [0, 0], moves = 0, locked = false;
        const trail = [[0, 0]];

        body.innerHTML = `
            <div class="question small">Guide le ninja jusqu’au temple</div>
            <div class="fig-wrap" id="mz-fig"></div>
            <div class="feedback" id="mz-status"></div>
            <div class="dpad">
                <button class="key" data-dir="up" aria-label="Haut">▲</button>
                <button class="key" data-dir="left" aria-label="Gauche">◀</button>
                <button class="key" data-dir="down" aria-label="Bas">▼</button>
                <button class="key" data-dir="right" aria-label="Droite">▶</button>
            </div>`;
        const fig = body.querySelector('#mz-fig'), status = body.querySelector('#mz-status');
        const render = () => { fig.innerHTML = this.svg(walls, cols, rows, pos, trail); status.textContent = `Pas : ${moves} / ${limit}`; };

        const move = dir => {
            if (locked) return;
            const [x, y] = pos;
            if (walls[y][x][dir]) { playSound(120, 'sawtooth', 0.08, 0.08); return; }
            const [dx, dy] = this.DIRS[dir];
            pos = [x + dx, y + dy]; moves++; trail.push(pos); sounds.tap(); render();
            if (pos[0] === cols - 1 && pos[1] === rows - 1) {
                locked = true; UI.cardFeedback(true); sounds.puzzleWin(); status.textContent = 'Bravo, tu as trouvé la sortie !';
                setTimeout(() => finish('win'), 1000);
            } else if (moves >= limit) {
                locked = true; UI.cardFeedback(false); sounds.puzzleFail(); status.textContent = 'Trop de pas… retente !';
                setTimeout(() => finish('lose'), 1800);
            }
        };

        body.querySelectorAll('.dpad .key').forEach(b => { b.onclick = () => move(b.dataset.dir); });
        const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', z: 'up', s: 'down', q: 'left', d: 'right' };
        UI.modalKeys = e => { const d = keyMap[e.key]; if (d) move(d); };
        render();
    }
};
