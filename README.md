# Ninja Adventure

Un jeu de plateforme japonais en JavaScript pur (canvas), où l'on résout des énigmes pour libérer un dragon et sauver son ami. Aucune dépendance, aucun build.

Le site propose un menu pour choisir sa version :

| Version | Dossier | Contenu |
|---|---|---|
| **V2** | [`v2/`](v2/) | Interface illustrée, morpion, calcul (+, −, ×, doubles), fractions, pendu de 180 mots |
| **V1** | [`v1/`](v1/) | L'aventure originale : 5 niveaux, additions, pendu |

## Jouer

En ligne : <https://flofrad.github.io/ninja-adventure/> (la racine du site affiche le menu).

En local, depuis la racine du dépôt :

```bash
python3 -m http.server 8765
```

Puis ouvrir <http://localhost:8765/> (menu), `/v1/` ou `/v2/`. La V2 s'ouvre aussi en double-cliquant sur `v2/index.html`.

## Commandes

| Action | Clavier | Tactile |
|---|---|---|
| Bouger | `←` `→` (ou `Q` `D` / `A` `D`) | boutons ◀ ▶ |
| Sauter | `↑` (ou `Z` / `W`) | bouton ▲ |
| Lancer un shuriken | `Espace` | bouton ✴ |

La manette tactile s'affiche automatiquement sur mobile, et le bouton 🎮 la montre ou la cache.
Dans les énigmes, le clavier physique fonctionne : chiffres, `Entrée` et `Retour arrière` pour le calcul ; lettres pour le pendu ; touches `1` à `9` pour le morpion.

## But du jeu (V2)

1. Parcourir le niveau, ramasser les étoiles (+5) et ouvrir les parchemins (+20, ou +10 pour un match nul au morpion).
2. À 100 points, la cage s'ouvre et le dragon attaque : sautez dessus ou lancez des shurikens (3 coups).
3. Cinq niveaux, avec une difficulté croissante et un décor différent à chaque fois. Trois vies (lanternes).

### Énigmes

| Parchemin | Contenu |
|---|---|
| 📜 Calcul | Additions, soustractions (jamais négatives), multiplications, doubles |
| 🍕 Fractions | Fraction coloriée à identifier ; « la moitié, le quart, le tiers de… » |
| 🗡️ Pendu | 180 mots en 6 catégories, avec indice, longueur croissante selon le niveau |
| ⭕ Morpion | Contre le Shinobi : IA aléatoire au niveau 1, imbattable au niveau 5 |

## Paramètres de debug (V2)

À ajouter à l'adresse de `v2/` :

| Paramètre | Effet |
|---|---|
| `?autostart=1` | saute l'écran titre |
| `?level=3` | démarre au niveau 3 (1 à 5) |
| `?puzzle=morpion` | tous les parchemins sont de ce type (`math`, `fraction`, `word`, `morpion`) |

Exemple : `v2/?autostart=1&level=5&puzzle=word`.

## Structure

```
index.html            menu de choix de version
v1/index.html         V1 (un seul fichier, Tailwind via CDN)
v2/
  index.html          écrans et HUD
  css/style.css       design system (variables, parchemin, boutons, animations)
  js/
    config.js         constantes, état global, utilitaires
    audio.js          sons synthétisés (Web Audio)
    render.js         canvas HD, décor en parallaxe, 5 thèmes, particules
    entities.js       ninja, dragon, niveau, collisions, dessins
    ui.js             HUD, bannière, fenêtre d'énigme
    puzzles/          math, fractions, hangman, tictactoe, manager
    cinematic.js      cinématique de fin
    main.js           boucle de jeu (pas fixe 60 Hz), entrées, démarrage
```

## Licence

Aucune licence n'est précisée pour l'instant.
