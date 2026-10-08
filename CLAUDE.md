# CLAUDE.md

Jeu de plateforme « Ninja Adventure » en JavaScript pur, sans build ni dépendance. Publié via GitHub Pages depuis la racine de `main`. Réponds en français au propriétaire du dépôt.

## Structure

- `index.html` : menu de choix de version (page autonome, CSS inline).
- `v1/index.html` : version originale, un seul fichier (Tailwind CDN). **Figée** : ne la modifie que si on te le demande.
- `v2/` : interface illustrée, 4 énigmes, niveau CE1.
- `v3/` : **version actuelle**. Copie de la V2 avec 20 énigmes, un menu de choix des types d'énigmes avant la partie et une cinématique de fin en cliffhanger (la V2 garde son ancienne fin).
- Les versions sont des **copies indépendantes** (pas de code partagé) pour pouvoir en figer une. Un correctif de moteur (rendu, boucle, bug) se reporte à la main dans `v2/` et `v3/`.

Détail des fichiers : [README](README.md#structure).

## Lancer et tester

```bash
python3 -m http.server 8765   # depuis la racine, puis http://localhost:8765/
```

Pas de tests automatisés ni de linter. Vérifications utiles :

- Syntaxe : `for f in v3/js/*.js v3/js/puzzles/*.js; do node --check $f; done`
- Debug : `?autostart=1&level=N&puzzle=<id>` (V2 et V3), et `&types=id1,id2` pour la V3 (voir `PARAMS` dans `config.js`). V3 : `?cine=1&scene=N` (N de 0 à 3) ouvre directement la cinématique de fin.
- Les générateurs d'énigmes se testent en Node avec le module `vm` : charger `config.js` puis les fichiers de `puzzles/` dans un même contexte, et appeler les `make()` / `generate()` des milliers de fois (réponses entières ≥ 0, mauvaises réponses distinctes de la bonne, pas de répétition consécutive). Les `start()` demandent le DOM : les tester dans le navigateur en ouvrant chaque énigme à chaque niveau.
- `TicTacToe.selfTest()` doit renvoyer `0` (l'IA de niveau 5 ne perd jamais).
- Un onglet de navigateur caché ou non affiché suspend `requestAnimationFrame` et ralentit les `setTimeout` : le jeu semble figé, la cinématique avance au ralenti. Pour tester la logique, avance la simulation à la main avec `stepOnce()` (une frame à 60 Hz) plutôt que d'attendre.

## Architecture (V2 et V3)

- **Scripts classiques, pas de modules ES** : le jeu doit rester ouvrable en `file://`. Tout est global ; l'ordre des `<script>` dans `index.html` compte (config → audio → render → entities → ui → puzzles → cine-art → cinematic → main). Les fonctions entre fichiers ne sont appelées qu'au runtime, après chargement complet. Dans `puzzles/`, `common.js` passe en premier et `registry.js` juste avant `manager.js`.
- **État unique** : l'objet `state` de `config.js`. `state.mode` pilote tout : `title | play | puzzle | transition | gameover | win`. Le menu de choix de la V3 est un écran superposé pendant le mode `title`, ouvert par le bouton « Choisir mes énigmes » de l'écran titre ; « Jouer » démarre directement avec la sélection mémorisée (`localStorage`, clé `ninja-v3-types`, enregistrée à chaque modification). Ne réintroduis pas de booléens parallèles.
- **Boucle** (`main.js`) : pas fixe à 60 Hz (`CFG.stepMs`) via un accumulateur, indépendant du taux de rafraîchissement. Toute la physique est exprimée par frame.
- **Coordonnées virtuelles 800×450** (`VW`, `VH`). Le canvas est mis à l'échelle avec `RS` (devicePixelRatio) ; dessine toujours en coordonnées virtuelles. Le décor statique est pré-rendu dans des canvas hors écran (`Background.rebuild`), reconstruit au redimensionnement et au changement de thème. `resizeCanvas` ignore un conteneur de taille 0.
- **Niveaux** : `THEMES[level - 1]` (render.js) donne l'ambiance. La difficulté des énigmes est lue dans des tables indexées par niveau 1 à 5 dans chaque module.
- **Cinématique de fin** (V3) : 4 scènes puis un écran « À suivre… » (cliffhanger vers le futur *Ninja Adventure 4*). Histoire, personnages et pistes pour la suite : [README](README.md#lhistoire-de-fin-v3). Tout est en DOM dans `#final-cinematic` (squelette dans `index.html`), calé sur le canvas (`#stage`, unité CSS `--u` = hauteur / 450, donc les coordonnées sont des pixels virtuels 800×450). Le fond est le décor du jeu : chaque scène choisit un thème de `THEMES`.
  - `cine-art.js` : dessins SVG (personnages de face, gabarit 120×170 ; décors). Les animations sont en CSS (`.walk`, `.cheer`, `.talk`…) et l'émotion se règle avec `data-emo` (`normal | happy | worry | angry | shock | sleep`).
  - `cinematic.js` : le déroulé est un script `async` (`aube`, `village`, `fete`, `nuit`, `finale`). Chaque `await` attend un délai (`wait`), un déplacement (`go`) ou un appui du joueur (`say` : bulle au-dessus du personnage, texte tapé lettre par lettre). Les voix et couleurs des personnages sont dans `CAST`.
  - Tous les délais passent par `Cinematic.at` / `every` (suivis dans `timers` / `intervals`) : `Cinematic.stop()` les annule et les promesses en attente ne se résolvent jamais, donc le script s'arrête net. N'utilise pas de `setTimeout` direct dans le script.
  - Entrées : toucher l'écran, Entrée, Espace ou → font avancer ; Échap ou « Passer » saute à l'écran final. La musique change par scène (`setEndMood` dans `audio.js`).
  - Ajouter un personnage : une fonction dans `cine-art.js` + une entrée dans `FIGURES` ; s'il parle, une entrée dans `CAST`.

### Énigmes

Chaque module de `puzzles/` expose `start(body, level, finish)` et appelle `finish('win' | 'draw' | 'lose')`. La fenêtre vient de `UI.openModal`, les touches clavier de `UI.modalKeys`.

- **V2** : un type se déclare dans `PUZZLE_META` (`manager.js`), `SCROLL_STYLE` (`entities.js`) et `Puzzles.plan`.
- **V3** : un type se déclare **uniquement** dans `PUZZLES` de `registry.js` (id, famille, icône, libellé, description, titre de la fenêtre, glyphe et couleur du parchemin, module). Le menu de choix, `Puzzles.plan` et le dessin des parchemins s'en déduisent. Puis ajouter le `<script>` dans `v3/index.html`.
- Briques communes V3 (`common.js`) : `buildNumeric` (clavier numérique, `q = { html, answer, figure?, suffix?, noEq?, small? }`) et `buildChoices` (boutons de réponse, `cfg = { question, figure?, choices, cols?, cls?, win?, reveal? }`), plus `mixChoices`, `pickDistinct`, `noRepeat` (évite deux fois la même question). Réutilise-les avant d'écrire une interface sur mesure.
- Les mini-jeux sans bonne réponse unique (memory, labyrinthe, ranger, mot mélangé) gèrent leurs propres limites d'essais et finissent par `win` ou `lose`.

## Conventions

- Code et commentaires en français, sans accents dans les identifiants. Reste dans le style existant : 4 espaces, guillemets simples, `'use strict'`.
- Les mots du pendu (`WORD_BANK`) sont en majuscules A–Z uniquement, sans accents ni doublons. Les autres énigmes de la V3 réutilisent cette banque (`Hangman.entries`). Les mots à accents ne vont que dans des données dédiées (syllabes, pluriel).
- Niveau visé : **CE1** (tables de 2, 3, 4, 5 et 10 ; doubles jusqu'à 50 ; fractions 1/2, 1/3, 1/4). Ne sors pas de ce périmètre sans qu'on le demande.
- Réponses numériques : toujours des entiers positifs de 4 chiffres maximum (clavier limité à 4 chiffres).
- Les fenêtres d'énigme doivent tenir dans un écran de ~640 px de haut (la fenêtre défile sinon) : garde les figures compactes et utilise `small` pour les longues questions.
- Ne rajoute pas de dépendance ni d'étape de build. Les polices Google sont chargées avec repli sur des polices système.
- **Cache GitHub Pages** : les navigateurs gardent JS et CSS ~10 min. Les `<script>` et la feuille de style de `v2/index.html` et `v3/index.html` portent un paramètre `?v=X.Y`. **Incrémente-le dans le `index.html` de la version modifiée à chaque changement de JS ou de CSS**, sinon un visiteur peut recevoir un nouvel HTML avec d'anciens scripts (démarrage cassé, boutons inactifs). `boot()` est protégé par un `try/catch` qui affiche alors un message demandant de recharger la page sans le cache.

## Git

- Branche par défaut : `main`, poussée sur `origin` (GitHub Pages). Ne pousse que si on te le demande.
- Messages de commit courts et descriptifs (l'historique mélange anglais et français).
