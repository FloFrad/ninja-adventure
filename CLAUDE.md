# CLAUDE.md

Jeu de plateforme « Ninja Adventure » en JavaScript pur, sans build ni dépendance. Publié via GitHub Pages depuis la racine de `main`. Réponds en français au propriétaire du dépôt.

## Structure

- `index.html` : menu de choix de version (page autonome, CSS inline).
- `v1/index.html` : version originale, un seul fichier (Tailwind CDN). **Figée** : ne la modifie que si on te le demande.
- `v2/` : version actuelle. Détail des fichiers dans le [README](README.md#structure).

## Lancer et tester

```bash
python3 -m http.server 8765   # depuis la racine, puis http://localhost:8765/
```

Pas de tests automatisés ni de linter. Vérifications utiles :

- Syntaxe : `for f in v2/js/*.js v2/js/puzzles/*.js; do node --check $f; done`
- Debug V2 : `?autostart=1&level=N&puzzle=math|fraction|word|morpion` (voir `PARAMS` dans `v2/js/config.js`).
- En console sur `v2/` : `TicTacToe.selfTest()` doit renvoyer `0` (l'IA de niveau 5 ne perd jamais) ; `MathPuzzle.generate(level)` et `FractionPuzzle.numericQuestion(level)` doivent toujours renvoyer des réponses entières ≥ 0.
- Un onglet de navigateur caché ou non affiché suspend `requestAnimationFrame` : le jeu semble figé. Pour tester la logique, avance la simulation à la main avec `stepOnce()` (une frame à 60 Hz) plutôt que d'attendre.

## Architecture V2

- **Scripts classiques, pas de modules ES** : le jeu doit rester ouvrable en `file://`. Tout est global ; l'ordre des `<script>` dans `v2/index.html` compte (config → audio → render → entities → ui → puzzles → cinematic → main). Les fonctions entre fichiers ne sont appelées qu'au runtime, après chargement complet.
- **État unique** : l'objet `state` de `config.js`. `state.mode` pilote tout : `title | play | puzzle | transition | gameover | win`. Ne réintroduis pas de booléens parallèles.
- **Boucle** (`main.js`) : pas fixe à 60 Hz (`CFG.stepMs`) via un accumulateur, indépendant du taux de rafraîchissement. Toute la physique est exprimée par frame.
- **Coordonnées virtuelles 800×450** (`VW`, `VH`). Le canvas est mis à l'échelle avec `RS` (devicePixelRatio) ; dessine toujours en coordonnées virtuelles. Le décor statique est pré-rendu dans des canvas hors écran (`Background.rebuild`), reconstruit au redimensionnement et au changement de thème.
- **Énigmes** : chaque module de `puzzles/` expose `start(body, level, finish)` et appelle `finish('win' | 'draw' | 'lose')`. La fenêtre vient de `UI.openModal`, les touches clavier de `UI.modalKeys`. Un nouveau type d'énigme se déclare dans `PUZZLE_META` (`manager.js`), `SCROLL_STYLE` (`entities.js`) et la liste de `Puzzles.plan`.
- **Niveaux** : `THEMES[level - 1]` (render.js) donne l'ambiance. La difficulté des énigmes est lue dans des tables indexées par niveau 1 à 5 dans chaque module.
- **Cinématique de fin** : en DOM, dans `#stage` (calé sur le canvas, unité CSS `--u` = hauteur / 450). Les timers sont suivis dans `Cinematic.timers` et nettoyés par `Cinematic.stop()`.

## Conventions

- Code et commentaires en français, sans accents dans les identifiants. Reste dans le style existant : 4 espaces, guillemets simples, `'use strict'`.
- Les mots du pendu (`WORD_BANK`) sont en majuscules A–Z uniquement, sans accents ni doublons.
- Réponses numériques : toujours des entiers positifs de 4 chiffres maximum (clavier limité à 4 chiffres).
- Ne rajoute pas de dépendance ni d'étape de build. Les polices Google sont chargées avec repli sur des polices système.

## Git

- Branche par défaut : `main`, poussée sur `origin` (GitHub Pages). Ne pousse que si on te le demande.
- Messages de commit courts et descriptifs (l'historique mélange anglais et français).
