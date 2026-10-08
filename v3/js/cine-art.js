'use strict';

// Dessins de la cinématique de fin : personnages et décors en SVG, assemblés par cinematic.js.
// Les personnages sont de face (gabarit 120 × 170, pieds en bas). Les animations sont en CSS et visent les groupes
// .arm-l, .arm-r, .leg-l, .leg-r, .head… ; l'émotion se règle avec l'attribut data-emo de la figure (voir style.css).

const Art = (() => {
    const INK = '#14161f', SKIN = '#f1c9a0', RED = '#d63a3a', RED_D = '#a62828', GOLD = '#f2b84b';
    const svg = (vb, body, cls = 'art') => `<svg class="${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
    const org = (x, y) => `style="transform-origin:${x}px ${y}px"`;
    const stroke = (d, c, w, extra = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

    // ---------------------------------------------------------------- Visages
    // Un groupe par émotion ; le CSS n'affiche que celui qui correspond à data-emo.
    function eyes(xl, xr, y, o = {}) {
        const { sclera = false, brow = INK, r = 1, iris = INK, bw = 2.8 } = o;
        const ball = (x, big = 1, pup = 1) => `<g class="eye">` + (sclera
            ? `<ellipse cx="${x}" cy="${y}" rx="${5 * r * big}" ry="${5.6 * r * big}" fill="#fff"/><circle cx="${x + 0.8}" cy="${y + 0.6}" r="${3.3 * r * pup}" fill="${iris}"/><circle cx="${x + 2}" cy="${y - 1.2}" r="${1.1 * r}" fill="#fff"/>`
            : `<ellipse cx="${x}" cy="${y}" rx="${4.1 * r * big}" ry="${5.3 * r * big}" fill="${iris}"/><circle cx="${x + 1.4}" cy="${y - 1.9}" r="${1.4 * r}" fill="#fff"/>`) + `</g>`;
        const br = (x1, y1, x2, y2) => stroke(`M${x1} ${y1} L${x2} ${y2}`, brow, bw);
        const arc = x => stroke(`M${x - 5.6} ${y + 2.6} Q${x} ${y - 6} ${x + 5.6} ${y + 2.6}`, INK, 3.2);
        const shut = x => stroke(`M${x - 5.2} ${y} Q${x} ${y + 4.5} ${x + 5.2} ${y}`, INK, 2.6);
        return `<g class="e e-normal">${ball(xl)}${ball(xr)}${br(xl - 6, y - 9, xl + 5, y - 10)}${br(xr - 5, y - 10, xr + 6, y - 9)}</g>`
            + `<g class="e e-happy">${arc(xl)}${arc(xr)}${br(xl - 6, y - 11, xl + 5, y - 12)}${br(xr - 5, y - 12, xr + 6, y - 11)}</g>`
            + `<g class="e e-worry">${ball(xl, 1.1)}${ball(xr, 1.1)}${br(xl - 7, y - 8, xl + 5, y - 13.5)}${br(xr - 5, y - 13.5, xr + 7, y - 8)}</g>`
            + `<g class="e e-angry">${ball(xl)}${ball(xr)}${br(xl - 7, y - 13, xl + 5.5, y - 6.5)}${br(xr - 5.5, y - 6.5, xr + 7, y - 13)}</g>`
            + `<g class="e e-shock">${ball(xl, 1.28, 0.7)}${ball(xr, 1.28, 0.7)}${br(xl - 6, y - 15, xl + 5, y - 15.5)}${br(xr - 5, y - 15.5, xr + 6, y - 15)}</g>`
            + `<g class="e e-sleep">${shut(xl)}${shut(xr)}</g>`;
    }

    function mouth(x, y, o = {}) {
        const c = o.color || '#7a2b2b';
        return `<g class="m m-normal">${stroke(`M${x - 5.5} ${y} Q${x} ${y + 4.5} ${x + 5.5} ${y}`, c, 2.4)}</g>`
            + `<g class="m m-happy"><path d="M${x - 8.5} ${y - 1} Q${x} ${y + 13} ${x + 8.5} ${y - 1} Z" fill="${c}"/><path d="M${x - 4} ${y + 5.5} Q${x} ${y + 2.5} ${x + 4} ${y + 5.5} Q${x} ${y + 9.5} ${x - 4} ${y + 5.5} Z" fill="#e8727a"/></g>`
            + `<g class="m m-worry">${stroke(`M${x - 5} ${y + 3} Q${x} ${y - 3} ${x + 5} ${y + 3}`, c, 2.4)}</g>`
            + `<g class="m m-angry">${stroke(`M${x - 5.5} ${y + 2} Q${x} ${y - 1.5} ${x + 5.5} ${y + 2}`, c, 2.6)}</g>`
            + `<g class="m m-shock"><ellipse cx="${x}" cy="${y + 2}" rx="3.8" ry="5.4" fill="${c}"/></g>`
            + `<g class="m m-sleep">${stroke(`M${x - 4} ${y + 1} L${x + 4} ${y + 1}`, c, 2.2)}</g>`
            + `<g class="m m-talk"><ellipse class="talk-lips" cx="${x}" cy="${y + 2}" rx="5" ry="4" fill="${c}"/></g>`;
    }

    // ---------------------------------------------------------------- Membres
    // Bras tendu le long du corps ; le groupe pivote autour de l'épaule (animations .cheer, .wave…)
    const armL = (sx, sy, ex, ey, sleeve, hand, w = 12, wrist = '') => `<g class="arm-l" ${org(sx, sy)}>${stroke(`M${sx} ${sy} L${ex} ${ey}`, sleeve, w)}${wrist}<circle cx="${ex - 1}" cy="${ey + 5}" r="5.6" fill="${hand}"/></g>`;
    const armR = (sx, sy, ex, ey, sleeve, hand, w = 12, wrist = '') => `<g class="arm-r" ${org(sx, sy)}>${stroke(`M${sx} ${sy} L${ex} ${ey}`, sleeve, w)}${wrist}<circle cx="${ex + 1}" cy="${ey + 5}" r="5.6" fill="${hand}"/></g>`;

    const footPair = (c1, c2) => `<g class="leg-l" ${org(50, 128)}><ellipse cx="46" cy="160" rx="13" ry="6.6" fill="${c1}"/><rect x="36" y="155.5" width="20" height="3.4" rx="1.7" fill="${c2}"/></g>`
        + `<g class="leg-r" ${org(70, 128)}><ellipse cx="74" cy="160" rx="13" ry="6.6" fill="${c1}"/><rect x="64" y="155.5" width="20" height="3.4" rx="1.7" fill="${c2}"/></g>`;

    const pantsLegs = (pants, wrap, shoe, sole) => `<g class="leg-l" ${org(50, 122)}><rect x="41" y="120" width="17" height="38" rx="8" fill="${pants}"/><rect x="41" y="143" width="17" height="7" fill="${wrap}"/><ellipse cx="47" cy="159" rx="12.5" ry="6.6" fill="${shoe}"/><rect x="36" y="154.6" width="21" height="3.4" rx="1.7" fill="${sole}"/></g>`
        + `<g class="leg-r" ${org(70, 122)}><rect x="62" y="120" width="17" height="38" rx="8" fill="${pants}"/><rect x="62" y="143" width="17" height="7" fill="${wrap}"/><ellipse cx="73" cy="159" rx="12.5" ry="6.6" fill="${shoe}"/><rect x="63" y="154.6" width="21" height="3.4" rx="1.7" fill="${sole}"/></g>`;

    const shadow = `<ellipse class="shadow" cx="60" cy="165" rx="32" ry="5" fill="rgba(0,0,0,.28)"/>`;
    const human = body => svg('0 0 120 170', `${shadow}<g class="fig-in">${body}</g>`, 'art art-human');

    // ---------------------------------------------------------------- Kaito : le ninja
    function kaito() {
        const sleeve = '#2a3050';
        const wrist = c => stroke(c, '#c9d1e0', 12.5);
        return human(`
            <g class="scarf-tail" ${org(46, 90)}><path d="M46 86 Q24 88 7 104 Q20 100 30 103 Q16 114 12 128 Q34 112 49 99 Z" fill="${RED}"/><path d="M30 103 Q16 114 12 128 Q26 118 36 106 Z" fill="${RED_D}"/></g>
            ${stroke('M30 134 L90 64', '#3a2a1d', 6.5)}
            <g class="katana">${stroke('M90 64 L98 54', GOLD, 5.5)}${stroke('M84 65 L93 72', GOLD, 3.4)}</g>
            ${pantsLegs('#1c2033', '#c9d1e0', INK, RED)}
            <path d="M40 86 Q60 79 80 86 L86 128 Q60 137 34 128 Z" fill="#2d3456"/>
            <path d="M34 128 Q60 137 86 128 L85 120 Q60 128 35 120 Z" fill="rgba(0,0,0,.2)"/>
            <rect x="36" y="110" width="48" height="10" rx="3" fill="${RED}"/>
            <path d="M80 112 L96 124 L88 126 Z" fill="${RED_D}"/><path d="M80 114 L92 134 L84 131 Z" fill="${RED}"/>
            ${armL(37, 92, 28, 118, sleeve, SKIN, 12.5, wrist('M29.5 113 L28 118'))}
            ${armR(83, 92, 92, 118, sleeve, SKIN, 12.5, wrist('M90.5 113 L92 118'))}
            <path d="M35 80 Q60 93 85 80 L86 91 Q60 104 34 91 Z" fill="${RED}"/>
            <circle cx="60" cy="50" r="31" fill="#232842"/>
            ${stroke('M38 33 Q48 22 63 21', 'rgba(255,255,255,.16)', 4)}
            <g class="head" ${org(60, 80)}>
                <g class="band-tails" ${org(89, 40)}><path d="M88 37 Q108 34 117 50 Q104 45 95 46 Z" fill="${RED}"/><path d="M89 41 Q107 46 112 63 Q100 54 92 48 Z" fill="${RED_D}"/></g>
                <circle cx="60" cy="50" r="31" fill="#232842"/>
                ${stroke('M38 33 Q48 22 63 21', 'rgba(255,255,255,.16)', 4)}
                <rect x="32" y="41" width="56" height="26" rx="13" fill="${SKIN}"/>
                <path d="M34 59 Q60 72 86 59 Q86 66 78 67 L42 67 Q34 66 34 59 Z" fill="rgba(200,140,100,.35)"/>
                ${eyes(47, 73, 55, { sclera: true, r: 1.05 })}
                <path d="M28 37 Q60 25 92 37 L92 46 Q60 34 28 46 Z" fill="${RED}"/>
                <rect x="47" y="30" width="26" height="14" rx="3.5" fill="#c9d1e0" stroke="#5a6278" stroke-width="1.6"/>
                <path d="M60 32.5 L62.2 37 L66.5 37.5 L63.3 40.5 L64.2 44 L60 42 L55.8 44 L56.7 40.5 L53.5 37.5 L57.8 37 Z" fill="#5a6278"/>
            </g>`);
    }

    // ---------------------------------------------------------------- Hana : la kunoichi, amie de Kaito
    function hana() {
        const sleeve = '#2a9d8f', hair = '#2b1d2e';
        return human(`
            <g class="pony" ${org(84, 40)}><path d="M82 34 Q116 30 112 70 Q110 96 96 100 Q104 76 96 62 Q90 50 80 48 Z" fill="${hair}"/><path d="M104 56 Q110 78 98 96" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="3" stroke-linecap="round"/></g>
            ${pantsLegs('#1f6f67', '#f6c6d8', '#2b1d2e', '#f06ba0')}
            <path d="M41 86 Q60 80 79 86 L90 130 Q60 140 30 130 Z" fill="#2a9d8f"/>
            <path d="M30 130 Q60 140 90 130 L88 122 Q60 132 32 122 Z" fill="rgba(0,0,0,.18)"/>
            <path d="M52 82 L60 100 L68 82 L64 80 L60 90 L56 80 Z" fill="#f7efdc"/>
            <rect x="37" y="106" width="46" height="11" rx="4" fill="#f06ba0"/>
            <path d="M56 108 L47 125 L55 123 Z M64 108 L73 125 L65 123 Z" fill="#d6437f"/><circle cx="60" cy="112" r="5.4" fill="#f06ba0" stroke="#d6437f" stroke-width="1.6"/>
            ${armL(37, 92, 28, 118, sleeve, SKIN, 12, stroke('M29.5 113 L28 118', '#f6c6d8', 12.5))}
            ${armR(83, 92, 92, 118, sleeve, SKIN, 12, stroke('M90.5 113 L92 118', '#f6c6d8', 12.5))}
            <g class="head" ${org(60, 80)}>
                <circle cx="31" cy="55" r="5" fill="${SKIN}"/><circle cx="89" cy="55" r="5" fill="${SKIN}"/>
                <circle cx="60" cy="52" r="29" fill="${SKIN}"/>
                <ellipse cx="41" cy="65" rx="6" ry="3.6" fill="#f08a8a" opacity=".5"/><ellipse cx="79" cy="65" rx="6" ry="3.6" fill="#f08a8a" opacity=".5"/>
                ${eyes(48, 72, 55, { brow: hair, iris: '#4a2f3a', r: 1.12, bw: 2.4 })}
                ${mouth(60, 69)}
                <path d="M30 54 Q26 16 60 17 Q94 16 90 54 Q86 36 74 33 Q62 42 50 34 Q36 38 30 54 Z" fill="${hair}"/>
                <path d="M30 54 Q27 66 33 76 Q37 64 38 54 Z M90 54 Q93 66 87 76 Q83 64 82 54 Z" fill="${hair}"/>
                <path d="M32 31 Q60 20 88 31 L88 38 Q60 27 32 38 Z" fill="#f06ba0"/>
                <rect x="49" y="25" width="22" height="12" rx="3" fill="#c9d1e0" stroke="#5a6278" stroke-width="1.5"/>
                <path d="M60 27 L61.8 31 L66 31.4 L62.8 34 L63.6 37 L60 35.4 L56.4 37 L57.2 34 L54 31.4 L58.2 31 Z" fill="#5a6278"/>
                <g transform="translate(86 29)"><path d="M0 0 L-9 -8 Q-12 0 -9 8 Z M0 0 L9 -8 Q12 0 9 8 Z" fill="#f06ba0" stroke="#d6437f" stroke-width="1.2"/><circle r="3.2" fill="#d6437f"/></g>
            </g>`);
    }

    // ---------------------------------------------------------------- Vêtements à longue robe (roi, reine, villageois)
    function robe({ robe: rc, shade, trim, belt, collar, sleeve, hand = SKIN, wide = false, hem = 154 }) {
        const sl = wide
            ? (side) => {
                const s = side === 'l' ? 1 : -1, x = side === 'l' ? 36 : 84, ox = (v) => (side === 'l' ? v : 120 - v);
                return `<g class="arm-${side}" ${org(x, 92)}><path d="M${ox(34)} 86 L${ox(16)} 102 Q${ox(6)} 128 ${ox(12)} 140 L${ox(36)} 132 L${ox(42)} 100 Z" fill="${sleeve}"/>`
                    + `<path d="M${ox(12)} 140 L${ox(36)} 132 L${ox(36)} 126 L${ox(8)} 133 Z" fill="${trim}"/><circle cx="${ox(25)}" cy="138" r="5.4" fill="${hand}"/></g>`;
            }
            : null;
        const armsSvg = wide ? sl('l') + sl('r')
            : armL(37, 92, 28, 120, sleeve, hand, 12.5) + armR(83, 92, 92, 120, sleeve, hand, 12.5);
        return footPair('#3a2a1d', trim)
            + `<path d="M34 84 Q60 76 86 84 L${wide ? 102 : 98} ${hem} Q60 ${hem + 10} ${wide ? 18 : 22} ${hem} Z" fill="${rc}"/>`
            + `<path d="M${wide ? 18 : 22} ${hem} Q60 ${hem + 10} ${wide ? 102 : 98} ${hem} L${wide ? 100 : 97} ${hem - 8} Q60 ${hem + 2} ${wide ? 20 : 23} ${hem - 8} Z" fill="${shade}"/>`
            + `<path d="M56 82 L64 82 L66 ${hem + 4} L54 ${hem + 4} Z" fill="${trim}"/>`
            + `<rect x="34" y="106" width="52" height="12" rx="3" fill="${belt}"/>`
            + armsSvg
            + `<path d="M40 82 Q60 98 80 82 L75 76 Q60 90 45 76 Z" fill="${collar}"/>`;
    }

    // ---------------------------------------------------------------- Le Roi
    function roi() {
        return human(robe({ robe: '#6a3d9a', shade: 'rgba(0,0,0,.2)', trim: GOLD, belt: '#a62828', collar: GOLD, sleeve: '#7c4cb0', wide: true })
            + `<circle cx="60" cy="112" r="4.6" fill="${GOLD}" stroke="#c98c1e" stroke-width="1.4"/>
            <g class="head" ${org(60, 80)}>
                <circle cx="31" cy="55" r="5" fill="${SKIN}"/><circle cx="89" cy="55" r="5" fill="${SKIN}"/>
                <path d="M26 66 Q22 100 60 104 Q98 100 94 66 Q82 82 60 82 Q38 82 26 66 Z" fill="#f4f1ea"/>
                <circle cx="60" cy="52" r="29" fill="${SKIN}"/>
                <path d="M31 50 Q27 66 36 80 Q40 66 44 58 Z M89 50 Q93 66 84 80 Q80 66 76 58 Z" fill="#f4f1ea"/>
                <ellipse cx="41" cy="63" rx="5" ry="3" fill="#f08a8a" opacity=".45"/><ellipse cx="79" cy="63" rx="5" ry="3" fill="#f08a8a" opacity=".45"/>
                ${eyes(48, 72, 52, { brow: '#f4f1ea', r: 0.95, bw: 4.4 })}
                <ellipse cx="60" cy="63" rx="3.6" ry="2.6" fill="#d9a07c"/>
                ${mouth(60, 74)}
                <path d="M60 67 Q46 62 38 70 Q48 74 60 69 Q72 74 82 70 Q74 62 60 67 Z" fill="#f4f1ea"/>
                <path d="M31 33 L33 9 L47 22 L60 3 L73 22 L87 9 L89 33 Q60 26 31 33 Z" fill="${GOLD}" stroke="#c98c1e" stroke-width="2" stroke-linejoin="round"/>
                <rect x="31" y="28" width="58" height="8" rx="3" fill="#e0a63a" stroke="#c98c1e" stroke-width="1.6"/>
                <circle cx="60" cy="32" r="3.8" fill="${RED}"/><circle cx="43" cy="32" r="2.4" fill="#4aa3e8"/><circle cx="77" cy="32" r="2.4" fill="#4aa3e8"/>
                <circle cx="33" cy="9" r="2.6" fill="#fff3b0"/><circle cx="60" cy="3" r="2.8" fill="#fff3b0"/><circle cx="87" cy="9" r="2.6" fill="#fff3b0"/>
            </g>`);
    }

    // ---------------------------------------------------------------- La Reine
    function reine() {
        return human(`<path d="M36 40 Q14 70 24 108 Q44 88 46 52 Z M84 40 Q106 70 96 108 Q76 88 74 52 Z" fill="#1d1620"/>`
            + robe({ robe: '#f27aa8', shade: 'rgba(120,20,60,.18)', trim: '#fff3d6', belt: GOLD, collar: '#fff3d6', sleeve: '#f98fb6', wide: true })
            + `<path d="M36 98 Q60 106 84 98 L86 126 Q60 134 34 126 Z" fill="${GOLD}"/><path d="M36 106 Q60 114 84 106 M35 116 Q60 124 85 116" fill="none" stroke="#c98c1e" stroke-width="1.6"/>
            <path d="M50 108 Q60 98 70 108 Q60 122 50 108 Z" fill="${RED}"/>
            <g fill="#fff3d6" opacity=".9"><circle cx="40" cy="140" r="3"/><circle cx="80" cy="144" r="3"/><circle cx="60" cy="147" r="3"/><circle cx="48" cy="150" r="2.2"/></g>
            <g class="head" ${org(60, 80)}>
                <circle cx="31" cy="55" r="5" fill="${SKIN}"/><circle cx="89" cy="55" r="5" fill="${SKIN}"/>
                <circle cx="60" cy="52" r="29" fill="${SKIN}"/>
                <ellipse cx="41" cy="64" rx="6" ry="3.6" fill="#f08a8a" opacity=".55"/><ellipse cx="79" cy="64" rx="6" ry="3.6" fill="#f08a8a" opacity=".55"/>
                ${eyes(48, 72, 54, { brow: '#1d1620', r: 1.1, bw: 2.2 })}
                ${mouth(60, 69, { color: '#c0364e' })}
                <path d="M29 56 Q24 14 60 14 Q96 14 91 56 Q86 36 72 32 Q62 40 50 32 Q36 38 29 56 Z" fill="#1d1620"/>
                <circle cx="60" cy="10" r="14" fill="#1d1620"/><path d="M52 6 Q58 0 66 4" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-linecap="round"/>
                <path d="M46 24 L52 11 L60 22 L68 11 L74 24 Z" fill="${GOLD}" stroke="#c98c1e" stroke-width="1.6" stroke-linejoin="round"/>
                ${stroke('M78 6 L100 -2', GOLD, 2.6)}<circle cx="102" cy="-3" r="4" fill="#f27aa8" stroke="#fff3d6" stroke-width="1.4"/>
                ${stroke('M42 8 L22 2', GOLD, 2.6)}<circle cx="20" cy="1.6" r="3.4" fill="#fff3d6" stroke="${GOLD}" stroke-width="1.4"/>
            </g>`);
    }

    // ---------------------------------------------------------------- Villageois
    const VILLAGERS = {
        paysan:  { robe: '#8a6b3a', trim: '#5a432a', belt: '#e8d9a8', sleeve: '#9c7a45', skin: '#e3b184', hat: 'kasa' },
        cuisiniere: { robe: '#e3873a', trim: '#fff', belt: '#fff', sleeve: '#ee9a50', skin: SKIN, hat: 'toque' },
        artiste: { robe: '#3b4a8a', trim: '#f7efdc', belt: '#f06ba0', sleeve: '#4a5ca0', skin: SKIN, hat: 'chignon' },
        enfant:  { robe: '#3fa34d', trim: '#f7efdc', belt: '#f2b84b', sleeve: '#58b862', skin: SKIN, hat: 'pique' },
        mamie:   { robe: '#8a6fb8', trim: '#f7efdc', belt: '#d9c8f0', sleeve: '#9c82c8', skin: '#f0cfa8', hat: 'mamie' }
    };
    function villageois(kind) {
        const v = VILLAGERS[kind] || VILLAGERS.paysan;
        const hats = {
            kasa: `<path d="M60 2 L104 36 Q60 28 16 36 Z" fill="#e8d28a" stroke="#b79a4a" stroke-width="2" stroke-linejoin="round"/><path d="M28 31 L60 6 M44 32 L60 8 M60 32 L60 6 M76 32 L60 8 M92 31 L60 6" stroke="#b79a4a" stroke-width="1" fill="none"/>`,
            toque: `<path d="M34 34 Q28 8 46 10 Q50 -2 60 4 Q70 -2 74 10 Q92 8 86 34 Z" fill="#fff" stroke="#d9d4c8" stroke-width="1.6"/><rect x="34" y="28" width="52" height="8" rx="3" fill="#fff" stroke="#d9d4c8" stroke-width="1.6"/>`,
            chignon: `<path d="M30 54 Q26 18 60 18 Q94 18 90 54 Q86 36 72 34 Q62 42 50 34 Q36 38 30 54 Z" fill="#2b1d2e"/><circle cx="60" cy="12" r="13" fill="#2b1d2e"/><circle cx="76" cy="14" r="5" fill="#f06ba0"/><circle cx="76" cy="14" r="2" fill="#fff3b0"/>`,
            pique: `<path d="M30 52 Q24 24 40 18 L38 4 L50 14 L58 -2 L66 14 L80 4 L80 18 Q96 24 90 52 Q86 34 70 30 Q60 38 50 30 Q36 34 30 52 Z" fill="#4a3226"/>`,
            mamie: `<path d="M29 54 Q26 18 60 18 Q94 18 91 54 Q86 36 72 32 Q62 40 50 32 Q36 38 29 54 Z" fill="#d8d8e0"/><circle cx="60" cy="14" r="12" fill="#d8d8e0"/><circle cx="60" cy="14" r="4" fill="#b8b8c8"/>`
        };
        const glasses = kind === 'mamie' ? `<circle cx="48" cy="54" r="9" fill="rgba(255,255,255,.2)" stroke="#6b5a3a" stroke-width="1.6"/><circle cx="72" cy="54" r="9" fill="rgba(255,255,255,.2)" stroke="#6b5a3a" stroke-width="1.6"/><path d="M57 54 L63 54" stroke="#6b5a3a" stroke-width="1.6"/>` : '';
        const apron = kind === 'cuisiniere' ? `<path d="M44 96 L76 96 L80 150 Q60 156 40 150 Z" fill="#fff" opacity=".95"/>` : '';
        const moustache = kind === 'paysan' ? `<path d="M60 63 Q50 60 44 66 Q52 68 60 65 Q68 68 76 66 Q70 60 60 63 Z" fill="#5a432a"/>` : '';
        return human(robe({ robe: v.robe, shade: 'rgba(0,0,0,.18)', trim: v.trim, belt: v.belt, collar: v.trim, sleeve: v.sleeve, hand: v.skin })
            + apron + `<g class="head" ${org(60, 80)}>
                <circle cx="31" cy="55" r="5" fill="${v.skin}"/><circle cx="89" cy="55" r="5" fill="${v.skin}"/>
                <circle cx="60" cy="52" r="29" fill="${v.skin}"/>
                <ellipse cx="41" cy="64" rx="6" ry="3.6" fill="#f08a8a" opacity=".45"/><ellipse cx="79" cy="64" rx="6" ry="3.6" fill="#f08a8a" opacity=".45"/>
                ${eyes(48, 72, 54, { r: 1.05, bw: 2.2, brow: kind === 'mamie' ? '#9a9aa8' : INK })}
                ${glasses}${mouth(60, 69)}${moustache}
                ${hats[v.hat]}
            </g>`);
    }

    // ---------------------------------------------------------------- Ryu : le dragon (mêmes formes que dans le jeu)
    function ryu() {
        return svg('0 0 300 220', `
            <ellipse class="shadow" cx="150" cy="213" rx="86" ry="7" fill="rgba(0,0,0,.28)"/>
            <g class="fig-in"><g transform="translate(150 118) scale(2.3)" stroke-linecap="round" stroke-linejoin="round">
                <g class="dr-tail" style="transform-origin:-24px 16px"><path d="M-24 16 C-48 26 -58 2 -44 -14" fill="none" stroke="#2f8a46" stroke-width="13"/><path d="M-50 -10 L-40 -26 L-36 -8 Z" fill="${RED}" stroke="none"/></g>
                <g class="dr-wing" style="transform-origin:-2px -8px"><path d="M-2 -8 L-44 -32 Q-42 -14 -31 -12 Q-29 -4 -18 -4 Q-14 4 -2 4 Z" fill="#c8453a" stroke="#7d1f1b" stroke-width="2.2"/><path d="M-2 -6 L-31 -12 M-2 -2 L-18 -4" fill="none" stroke="#7d1f1b" stroke-width="2.2"/></g>
                <g class="leg-l" style="transform-origin:-14px 22px"><ellipse cx="-14" cy="29" rx="9" ry="7" fill="#2f8a46"/><path d="M-9 35 L-7 40 L-5 35 M-15 35 L-13 40 L-11 35 M-21 35 L-19 40 L-17 35" fill="#fff"/></g>
                <g class="leg-r" style="transform-origin:15px 22px"><ellipse cx="15" cy="30" rx="9" ry="7" fill="#2f8a46"/><path d="M20 36 L22 41 L24 36 M14 36 L16 41 L18 36 M8 36 L10 41 L12 36" fill="#fff"/></g>
                <g class="dr-body"><ellipse cx="0" cy="8" rx="29" ry="23" fill="#3fa34d"/><path d="M-27 2 Q0 -22 27 4 Q0 -10 -27 2 Z" fill="#5cc866"/>
                <ellipse cx="7" cy="14" rx="17" ry="14" fill="#f4dc9a"/>
                <path d="M-6 8 Q7 12 20 8 M-4 14 Q7 18 18 14 M-2 20 Q7 24 16 20" fill="none" stroke="rgba(160,120,50,.45)" stroke-width="1.5"/>
                <g fill="${RED}"><path d="M-24 -2 L-20 -12 L-16 -3 Z M-14 -7 L-10 -17 L-6 -8 Z M-4 -10 L0 -20 L4 -11 Z M6 -12 L10 -21 L14 -12 Z"/></g></g>
                <path d="M14 0 Q26 -4 28 -16" fill="none" stroke="#3fa34d" stroke-width="15"/>
                <g class="head dr-head" style="transform-origin:22px -4px">
                    <g class="dr-fire"><ellipse cx="62" cy="-15" rx="16" ry="9" fill="#ff9a3d" opacity=".9"/><ellipse cx="58" cy="-15" rx="9" ry="5" fill="#ffe27a"/></g>
                    <ellipse cx="38" cy="-13" rx="12" ry="5" fill="#2f8a46"/><ellipse class="dr-mouth" cx="40" cy="-15" rx="9" ry="4" fill="#7d1f1b"/>
                    <ellipse cx="34" cy="-23" rx="15" ry="11" fill="#4cb85a"/><ellipse cx="45" cy="-20" rx="10" ry="7" fill="#4cb85a"/>
                    <path d="M41 -15 L43 -11 L45 -15 M46 -15 L48 -11 L50 -15" fill="#fff"/>
                    <path d="M24 -30 L12 -46 L31 -33 Z M31 -32 L24 -48 L37 -33 Z" fill="#e8d9a8"/>
                    <circle cx="50" cy="-23" r="1.6" fill="#1c2a1f"/>
                    <path class="dr-smile" d="M37 -15.5 Q44 -12 51 -16" fill="none" stroke="#17331f" stroke-width="1.3"/>
                    <circle class="dr-glow" cx="37" cy="-27" r="9" fill="#ff3b3b" opacity=".5"/>
                    <g class="dr-eye dr-eye-open"><circle cx="37" cy="-27" r="4.6" fill="#fff"/><circle class="dr-iris" cx="38" cy="-27" r="3.2" fill="#f7c531"/><rect x="37.4" y="-30" width="1.4" height="6.5" fill="#111"/>
                        <path class="dr-brow dr-brow-calm" d="M30 -33.5 Q37 -36.5 43 -32.5" fill="none" stroke="#17331f" stroke-width="1.8"/>
                        <path class="dr-brow dr-brow-mad" d="M29 -34 L43 -29.5" fill="none" stroke="#17331f" stroke-width="2.6"/></g>
                    <path class="dr-eye dr-eye-shut" d="M32.5 -26 Q37 -22 41.5 -26" fill="none" stroke="#17331f" stroke-width="2.2"/>
                    <path class="dr-eye dr-eye-happy" d="M32.5 -24.5 Q37 -31 41.5 -24.5" fill="none" stroke="#17331f" stroke-width="2.4"/>
                </g>
            </g></g>`, 'art art-ryu');
    }

    // ---------------------------------------------------------------- Kage : le Maître de l'Ombre (masque de renard)
    function kage() {
        return svg('0 0 160 240', `
            <ellipse class="shadow" cx="80" cy="232" rx="46" ry="6" fill="rgba(0,0,0,.35)"/>
            <g class="fig-in">
                <g class="k-smoke"><ellipse cx="80" cy="222" rx="62" ry="14" fill="#2a1448" opacity=".55"/><ellipse cx="46" cy="214" rx="30" ry="12" fill="#3a1d5e" opacity=".5"/><ellipse cx="116" cy="216" rx="32" ry="12" fill="#3a1d5e" opacity=".5"/></g>
                <g class="k-cloak" ${org(80, 100)}><path d="M44 96 Q80 82 116 96 L138 168 L150 224 L136 212 L126 230 L112 212 L98 232 L82 212 L66 232 L52 212 L38 230 L26 212 L10 224 L22 168 Z" fill="#120d20"/>
                <path d="M66 104 L94 104 L108 222 L52 222 Z" fill="#2a1448"/><path d="M44 96 Q80 82 116 96 L120 108 Q80 96 40 108 Z" fill="#1c1432"/></g>
                <path d="M38 150 Q80 162 122 150 L124 164 Q80 176 36 164 Z" fill="${RED_D}"/>
                <path d="M34 82 L52 40 L80 66 L108 40 L126 82 L80 112 Z" fill="${RED_D}"/>
                <g class="k-arm-l" ${org(46, 104)}><path d="M46 100 Q22 124 28 170 Q50 176 66 160 Q62 130 62 108 Z" fill="#1a1230"/><path d="M28 170 Q50 176 66 160 L64 152 Q48 164 30 160 Z" fill="#3a1d5e"/><g class="k-hand"><path d="M34 168 L31 186 M43 172 L42 190 M52 170 L54 187" stroke="#e8dfd0" stroke-width="4" stroke-linecap="round"/></g></g>
                <g class="k-arm-r" ${org(114, 104)}><path d="M114 100 Q138 124 132 170 Q110 176 94 160 Q98 130 98 108 Z" fill="#1a1230"/><path d="M132 170 Q110 176 94 160 L96 152 Q112 164 130 160 Z" fill="#3a1d5e"/></g>
                <g class="head" ${org(80, 100)}>
                    <path d="M30 76 Q26 14 80 8 Q134 14 130 76 Q104 66 80 66 Q56 66 30 76 Z" fill="#120d20"/>
                    <path d="M44 48 L34 6 L70 34 Z" fill="#fbf6ee"/><path d="M47 40 L41 16 L62 33 Z" fill="${RED}"/>
                    <path d="M116 48 L126 6 L90 34 Z" fill="#fbf6ee"/><path d="M113 40 L119 16 L98 33 Z" fill="${RED}"/>
                    <path d="M42 44 Q80 28 118 44 Q122 72 104 92 Q80 108 56 92 Q38 72 42 44 Z" fill="#fbf6ee"/>
                    <path d="M44 62 Q38 74 52 90 Q42 76 46 62 Z M116 62 Q122 74 108 90 Q118 76 114 62 Z" fill="#e8dfd0"/>
                    <path d="M80 38 L86 50 L80 58 L74 50 Z" fill="${RED}"/>
                    <path d="M54 66 Q47 78 58 90 M106 66 Q113 78 102 90 M60 70 Q56 78 62 86 M100 70 Q104 78 98 86" fill="none" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>
                    <g class="k-eyes"><path d="M52 55 Q64 50 74 60 Q60 62 52 55 Z" fill="#ff2d55"/><path d="M108 55 Q96 50 86 60 Q100 62 108 55 Z" fill="#ff2d55"/>
                        <path d="M52 55 Q64 50 74 60" fill="none" stroke="#ffd0d8" stroke-width="1.2"/><path d="M108 55 Q96 50 86 60" fill="none" stroke="#ffd0d8" stroke-width="1.2"/></g>
                    <path d="M74 79 L86 79 L80 87 Z" fill="${INK}"/>
                    <path d="M68 92 Q80 98 92 92" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
                </g>
            </g>`, 'art art-kage');
    }

    // ---------------------------------------------------------------- Décors et accessoires
    function cageBack() {
        return svg('0 0 220 190', `
            <rect x="26" y="40" width="168" height="122" fill="rgba(10,12,24,.55)"/>
            ${[38, 62, 86, 110, 134, 158, 182].map(x => `<rect x="${x - 3}" y="38" width="6" height="126" rx="3" fill="#2a2d44"/>`).join('')}`, 'art cage-art');
    }
    function cageFront() {
        const bars = [28, 52, 76, 100, 124, 148, 172, 196].map((x, i) => `<g class="cage-bar" style="--i:${i}"><rect x="${x - 4}" y="38" width="8" height="128" rx="4" fill="#1b1d2c"/><rect x="${x - 2.4}" y="42" width="2.6" height="118" rx="1.3" fill="#7a809c"/></g>`).join('');
        return svg('0 0 220 190', `
            <g class="cage-bars">${bars}</g>
            <g class="cage-top"><rect x="18" y="30" width="184" height="14" rx="6" fill="#23263a"/><rect x="18" y="30" width="184" height="5" rx="2.5" fill="#3a3e58"/>
            <path d="M24 30 Q110 -14 196 30 Z" fill="#2c3050"/><path d="M40 28 Q110 -4 180 28" fill="none" stroke="#4a5078" stroke-width="3"/><circle cx="110" cy="6" r="6" fill="${GOLD}"/>
            ${stroke('M110 0 L110 -10', '#7a809c', 3)}</g>
            <g class="cage-base"><rect x="12" y="160" width="196" height="18" rx="6" fill="#23263a"/><rect x="12" y="160" width="196" height="5" rx="2.5" fill="#3a3e58"/><path d="M22 178 L22 186 M198 178 L198 186" stroke="#23263a" stroke-width="8" stroke-linecap="round"/></g>`, 'art cage-art');
    }

    // Sceau de papier (talisman) accroché à la cage
    function sceau() {
        return svg('0 0 40 76', `
            ${stroke('M20 0 L20 8', '#7a809c', 2.4)}
            <rect x="4" y="8" width="32" height="56" rx="3" fill="#f7efdc" stroke="#c9b78a" stroke-width="1.6"/>
            <path d="M4 64 L10 74 L16 64 L22 74 L28 64 L34 74 L36 64 Z" fill="#f7efdc" stroke="#c9b78a" stroke-width="1.2" stroke-linejoin="round"/>
            <rect x="8" y="12" width="24" height="48" rx="2" fill="none" stroke="${RED}" stroke-width="1.6"/>
            <text x="20" y="48" text-anchor="middle" font-family="'Kaisei Decol', serif" font-weight="700" font-size="28" fill="${RED}">封</text>`, 'art sceau-art');
    }

    function torii() {
        return svg('0 0 260 230', `
            <rect x="40" y="48" width="24" height="176" fill="#c8352f"/><rect x="196" y="48" width="24" height="176" fill="#c8352f"/>
            <rect x="40" y="48" width="7" height="176" fill="rgba(255,255,255,.16)"/><rect x="196" y="48" width="7" height="176" fill="rgba(255,255,255,.16)"/>
            <rect x="34" y="214" width="36" height="14" rx="3" fill="#2b2a33"/><rect x="190" y="214" width="36" height="14" rx="3" fill="#2b2a33"/>
            <rect x="34" y="84" width="192" height="14" fill="#c8352f"/>
            <rect x="116" y="56" width="28" height="30" fill="#14161f"/><rect x="119" y="59" width="22" height="24" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
            <path d="M2 34 Q130 12 258 34 L252 50 Q130 34 8 50 Z" fill="#1d1d28"/><rect x="14" y="48" width="232" height="16" fill="#c8352f"/><rect x="14" y="48" width="232" height="4" fill="rgba(255,255,255,.18)"/>`, 'art torii-art');
    }

    function maison() {
        const win = (x, y) => `<rect x="${x}" y="${y}" width="36" height="34" fill="#3a2a1d"/><rect class="win" x="${x + 3}" y="${y + 3}" width="30" height="28" style="fill:var(--win,#ffe9a8)"/><path d="M${x + 18} ${y + 3} V${y + 31} M${x + 3} ${y + 17} H${x + 33}" stroke="#3a2a1d" stroke-width="2"/>`;
        return svg('0 0 250 190', `
            <rect x="28" y="96" width="194" height="88" fill="#d9c9a4"/><rect x="28" y="96" width="194" height="88" fill="rgba(0,0,0,.08)"/>
            <path d="M28 96 H222 V108 H28 Z" fill="#6e4a32"/><path d="M28 176 H222 V184 H28 Z" fill="#6e4a32"/>
            ${[48, 82, 168, 202].map(x => `<rect x="${x - 3}" y="96" width="6" height="88" fill="#6e4a32"/>`).join('')}
            ${win(42, 118)}${win(170, 118)}
            <rect x="106" y="114" width="40" height="70" fill="#3a2a1d"/><rect x="109" y="118" width="34" height="66" fill="#8a5a38"/>
            <path d="M103 110 H149 V140 L141 134 L133 142 L125 134 L117 142 L109 134 L103 140 Z" fill="#2f3a74"/><circle cx="126" cy="124" r="5" fill="#f7efdc"/>
            <path d="M-2 106 Q34 100 125 36 Q216 100 252 106 L238 118 L12 118 Z" fill="#3b4560"/>
            <path d="M-2 106 Q34 100 125 36 Q216 100 252 106 L248 108 Q210 108 125 48 Q40 108 2 108 Z" fill="#53608a"/>
            ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${14 + i * 34} 112 Q${27 + i * 34} 100 ${40 + i * 34} 112" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/>`).join('')}
            <path d="M6 110 H244" stroke="rgba(0,0,0,.3)" stroke-width="3"/>`, 'art maison-art');
    }

    // Guirlande de lanternes tendue en haut de la scène (n lanternes sur une courbe)
    let lanternUid = 0;
    function lanternes(n = 8) {
        const id = 'lg' + (++lanternUid);
        let lan = '';
        for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n, x = 800 * t, y = 12 + 150 * t * (1 - t);
            lan += `<g class="lan" style="transform-origin:${x}px ${y}px;--d:${(i * 0.37).toFixed(2)}s"><circle cx="${x}" cy="${y + 24}" r="34" fill="url(#${id})"/>`
                + `<rect x="${x - 7}" y="${y}" width="14" height="5" rx="2" fill="#2a1f16"/><ellipse cx="${x}" cy="${y + 22}" rx="13" ry="17" fill="#e5483c"/>`
                + `<ellipse cx="${x}" cy="${y + 22}" rx="8" ry="12" fill="#ffb35c"/><path d="M${x - 12} ${y + 15} Q${x} ${y + 21} ${x + 12} ${y + 15} M${x - 13} ${y + 25} Q${x} ${y + 31} ${x + 13} ${y + 25}" fill="none" stroke="#7a1a1f" stroke-width="1.4"/>`
                + `<rect x="${x - 7}" y="${y + 36}" width="14" height="5" rx="2" fill="#2a1f16"/><path d="M${x} ${y + 41} v8" stroke="${GOLD}" stroke-width="2"/></g>`;
        }
        return svg('0 0 800 130', `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#ffb35c" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient></defs>`
            + `<path d="M-10 12 Q400 162 810 12" fill="none" stroke="#2a1f16" stroke-width="3"/>${lan}`, 'art lanternes-art');
    }

    function feu() {
        return svg('0 0 100 100', `
            <ellipse cx="50" cy="92" rx="36" ry="6" fill="rgba(0,0,0,.3)"/>
            <g class="flames"><g class="fl fl-1" ${org(50, 82)}><path d="M50 8 Q72 36 70 62 Q68 82 50 82 Q32 82 30 62 Q28 40 42 26 Q44 40 50 44 Q52 26 50 8 Z" fill="#e5483c"/></g>
            <g class="fl fl-2" ${org(50, 82)}><path d="M50 28 Q66 46 64 64 Q62 82 50 82 Q38 82 36 64 Q36 50 44 42 Q46 50 50 52 Z" fill="#ff9a3d"/></g>
            <g class="fl fl-3" ${org(50, 82)}><path d="M50 48 Q60 60 58 70 Q56 82 50 82 Q44 82 42 70 Q42 62 50 48 Z" fill="#ffe27a"/></g></g>
            ${stroke('M18 86 L82 74', '#6e4020', 11)}${stroke('M20 74 L80 88', '#8a5a38', 11)}
            <ellipse cx="22" cy="90" rx="9" ry="6" fill="#6b6f86"/><ellipse cx="78" cy="90" rx="9" ry="6" fill="#6b6f86"/><ellipse cx="50" cy="94" rx="10" ry="5" fill="#85899f"/>`, 'art feu-art');
    }

    function rouleau() {
        return svg('0 0 76 40', `
            <rect x="12" y="8" width="52" height="24" rx="8" fill="#f7e7b4"/><rect x="12" y="8" width="52" height="8" rx="4" fill="rgba(255,255,255,.55)"/><rect x="12" y="24" width="52" height="8" rx="4" fill="rgba(160,120,50,.25)"/>
            <ellipse cx="12" cy="20" rx="7" ry="13" fill="${GOLD}" stroke="#c98c1e" stroke-width="2"/><ellipse cx="64" cy="20" rx="7" ry="13" fill="${GOLD}" stroke="#c98c1e" stroke-width="2"/>
            <rect x="31" y="6" width="14" height="28" fill="${RED}"/><circle cx="38" cy="20" r="10" fill="${GOLD}" stroke="#c98c1e" stroke-width="1.6"/>
            <text x="38" y="26" text-anchor="middle" font-family="'Kaisei Decol', serif" font-weight="700" font-size="16" fill="${RED_D}">封</text>`, 'art rouleau-art');
    }

    // Une figure (conteneur + dessin) ; nom → fonction
    const FIGURES = { kaito, hana, roi, reine, ryu, kage };

    return {
        figure: (kind, variant) => FIGURES[kind] ? FIGURES[kind]() : villageois(variant || kind),
        villageois, cageBack, cageFront, sceau, torii, maison, lanternes, feu, rouleau
    };
})();
