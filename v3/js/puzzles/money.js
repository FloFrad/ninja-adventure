'use strict';

// Les euros : compter des pièces et des billets, puis rendre la monnaie
const Money = {
    last: {},
    // Valeurs disponibles par niveau
    coinsByLevel: { 1: [1, 2], 2: [1, 2, 5, 10], 3: [1, 2, 5, 10, 20], 4: [1, 2, 5, 10, 20], 5: [1, 2, 5, 10, 20] },
    limit: { 1: 10, 2: 25, 3: 60, 4: 80, 5: 100 },
    maxItems: { 1: 5, 2: 5, 3: 6, 4: 7, 5: 8 },
    goods: [['un onigiri', [2, 3, 4]], ['un ballon', [3, 4, 5, 6]], ['un livre', [5, 6, 7, 8, 9]], ['un masque', [4, 6, 8]], ['un éventail', [3, 5, 7]],
            ['un bonbon', [1, 2]], ['une lanterne', [6, 7, 8, 9]], ['un cerf-volant', [8, 9, 12, 14]], ['un petit sabre', [10, 12, 15, 18]], ['un tambour', [15, 16, 17, 19]]],

    item(v, x, y) {
        if (v <= 2) {
            const r = v === 1 ? 15 : 17, outer = v === 1 ? '#e6c04a' : '#cfd3da', inner = v === 1 ? '#cfd3da' : '#e6c04a';
            return `<g transform="translate(${x + r} ${y + 17})"><circle r="${r}" fill="${outer}" stroke="#8a6a1e" stroke-width="1.6"/><circle r="${r - 5}" fill="${inner}"/>
                <text text-anchor="middle" dominant-baseline="central" font-family="Nunito, sans-serif" font-weight="900" font-size="${v === 1 ? 14 : 15}" fill="#5a4410">${v}</text></g>`;
        }
        const col = { 5: '#9bb0a8', 10: '#e8737c', 20: '#6f9be0', 50: '#f0a35a' }[v];
        return `<g transform="translate(${x} ${y + 3})"><rect width="58" height="30" rx="4" fill="${col}" stroke="#4a4a55" stroke-width="1.6"/><rect x="4" y="4" width="50" height="22" rx="3" fill="none" stroke="rgba(255,255,255,.55)"/>
            <text x="29" y="15.5" text-anchor="middle" dominant-baseline="central" font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="#2b2a33">${v} €</text></g>`;
    },

    figure(values) {
        const sorted = values.slice().sort((a, b) => b - a);
        const MAX = 300; let x = 4, y = 0, out = '', used = 0;
        sorted.forEach(v => {
            const w = v <= 2 ? (v === 1 ? 30 : 34) : 58;
            if (x + w > MAX) { x = 4; y += 40; }
            out += this.item(v, x, y);
            x += w + 8; used = Math.max(used, x);
        });
        const W = Math.max(used, 90);
        return `<svg viewBox="0 0 ${W} ${y + 40}" class="fig fig-money" style="width:min(100%, ${Math.round(W * 1.6)}px)">${out}</svg>`;
    },

    makeCount(L) {
        const pool = this.coinsByLevel[L];
        let values, sum, guard = 0;
        do {
            const n = rand(2, this.maxItems[L]);
            values = Array.from({ length: n }, () => pick(pool));
            sum = values.reduce((a, b) => a + b, 0);
            guard++;
        } while ((sum > this.limit[L] || sum < 3) && guard < 100);
        return { html: 'Combien d’euros y a-t-il ?', figure: this.figure(values), answer: sum, suffix: '€', noEq: true, small: true, key: values.slice().sort().join(',') };
    },

    makeChange(L) {
        const paid = L === 4 ? pick([5, 10, 20]) : pick([10, 20, 50]);
        const offers = this.goods.flatMap(([n, prices]) => prices.filter(p => p < paid).map(p => [n, p]));
        const [name, price] = pick(offers);
        return {
            html: `${capitalize(name)} coûte <b>${price} €</b>. Tu paies avec un billet de <b>${paid} €</b>. Combien te rend-on ?`,
            figure: this.figure([paid]), answer: paid - price, suffix: '€', noEq: true, small: true, key: name + price + paid
        };
    },

    make(level) {
        const L = clamp(level, 1, 5);
        const change = L >= 4 && Math.random() < (L === 4 ? 0.5 : 0.65);
        return change ? this.makeChange(L) : this.makeCount(L);
    },

    start(body, level, finish) { buildNumeric(body, noRepeat(this.last, () => this.make(level)), finish); }
};
