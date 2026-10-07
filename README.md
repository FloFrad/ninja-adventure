# Ninja Adventure

Un jeu de plateforme japonais en JavaScript pur (canvas), où l'on résout des énigmes pour libérer un dragon et sauver son ami. Aucune dépendance, aucun build. Les versions 2 et 3 sont adaptées au niveau **CE1**.

Le site propose un menu pour choisir sa version :

| Version | Dossier | Contenu |
|---|---|---|
| **V3** | [`v3/`](v3/) | Édition CE1 : **20 types d'énigmes** que l'on active ou non dans un menu avant la partie |
| **V2** | [`v2/`](v2/) | Interface illustrée, morpion, calcul, fractions, pendu de 180 mots (niveau CE1) |
| **V1** | [`v1/`](v1/) | L'aventure originale : 5 niveaux, additions, pendu |

## Jouer

En ligne : <https://flofrad.github.io/ninja-adventure/> (la racine du site affiche le menu).

En local, depuis la racine du dépôt :

```bash
python3 -m http.server 8765
```

Puis ouvrir <http://localhost:8765/> (menu), `/v1/`, `/v2/` ou `/v3/`. Les versions 2 et 3 s'ouvrent aussi en double-cliquant sur leur `index.html`.

## Commandes

| Action | Clavier | Tactile |
|---|---|---|
| Bouger | `←` `→` (ou `Q` `D` / `A` `D`) | boutons ◀ ▶ |
| Sauter | `↑` (ou `Z` / `W`) | bouton ▲ |
| Lancer un shuriken | `Espace` | bouton ✴ |

La manette tactile s'affiche automatiquement sur mobile, et le bouton 🎮 la montre ou la cache.
Dans les énigmes, le clavier physique fonctionne aussi : chiffres, `Entrée` et `Retour arrière` pour le calcul ; lettres pour le pendu et le mot mélangé ; touches `1` à `9` pour les choix et le morpion ; flèches pour le labyrinthe.

## But du jeu (V2 et V3)

1. Parcourir le niveau, ramasser les étoiles (+5) et ouvrir les parchemins (+20 ; +10 pour un match nul au morpion).
2. À 100 points, la cage s'ouvre et le dragon attaque : sautez dessus ou lancez des shurikens (3 coups).
3. Cinq niveaux, avec une difficulté croissante et un décor différent à chaque fois. Trois vies (lanternes).

## V3 : choisir ses énigmes

Après « Jouer », un menu liste les 20 types d'énigmes en trois familles. On coche ce que l'on veut travailler (par famille ou un par un), puis « Commencer ». Les parchemins de la partie ne proposent que les types cochés. Le choix est mémorisé dans le navigateur (`localStorage`).

| Famille | Énigmes |
|---|---|
| 🔢 **Mathématiques** | Calcul (+, −, tables, doubles) · Fractions · Lire l'heure · Les euros (compter, rendre la monnaie) · Suites de nombres · Comparer et ranger · Dizaines et unités · Mesures (règle, cm, m, km) · Formes et symétrie |
| 📖 **Français** | Pendu · Mot mélangé · Lettre manquante · a/à, et/est, son/sont, on/ont, ou/où · Singulier et pluriel · Conjugaison au présent · Syllabes |
| 🧩 **Mémoire et logique** | Morpion · Memory · Labyrinthe · L'intrus |

La difficulté de chaque énigme monte avec le niveau (1 à 5) : par exemple l'heure passe des heures pile aux quarts d'heure, puis à la lecture inverse (choisir la bonne horloge).

## Paramètres de debug (V2 et V3)

À ajouter à l'adresse de `v2/` ou `v3/` :

| Paramètre | Effet |
|---|---|
| `?autostart=1` | saute l'écran titre (et le menu en V3) |
| `?level=3` | démarre au niveau 3 (1 à 5) |
| `?puzzle=morpion` | tous les parchemins sont de ce type |
| `?types=heure,suite` | (V3) types d'énigmes activés, séparés par des virgules |

Identifiants V2 : `math`, `fraction`, `word`, `morpion`. V3 : `math`, `fraction`, `heure`, `monnaie`, `suite`, `comparer`, `dizaines`, `longueur`, `formes`, `word`, `melange`, `lettre`, `homophone`, `pluriel`, `conjugaison`, `syllabes`, `morpion`, `memory`, `labyrinthe`, `intrus`.

Exemple : `v3/?autostart=1&level=5&types=heure,monnaie`.

## Structure

```
index.html            menu de choix de version
favicon.svg           icône (shuriken) · apple-touch-icon.png pour iPhone
v1/index.html         V1 (un seul fichier, Tailwind via CDN)
v2/                   V2 (niveau CE1)
v3/                   V3 : copie de la V2 + 16 nouvelles énigmes + menu de choix
  index.html          écrans, HUD, menu de choix des énigmes
  css/style.css       design system
  js/
    config.js         constantes, état global, utilitaires
    audio.js          sons synthétisés (Web Audio)
    render.js         canvas HD, décor en parallaxe, 5 thèmes, particules
    entities.js       ninja, dragon, niveau, collisions, dessins
    ui.js             HUD, bannière, fenêtre d'énigme, menu de choix
    cinematic.js      cinématique de fin
    main.js           boucle de jeu (pas fixe 60 Hz), entrées, démarrage
    puzzles/
      common.js       clavier numérique, choix multiples, utilitaires
      registry.js     catalogue des 20 énigmes (icône, titre, couleur…)
      manager.js      choix des types actifs, plan des parchemins
      *.js            un module par énigme
```

La V2 a la même structure, avec seulement 4 énigmes.

## Licence

Aucune licence n'est précisée pour l'instant.
