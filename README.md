# Factory TD

Jeu 2D de production et de défense — grille, usine, vagues jour/nuit, assaut
tous les 7 jours. Caméra libre, pas de personnage.

## Démarrer

```bash
npm install
npm run dev
```

Puis `npm run check` pour lancer typecheck + lint + tests.

## Commandes en jeu

| Action | Touche |
|---|---|
| Poser | clic gauche (maintenir pour poser en ligne) |
| Détruire | clic droit |
| Pivoter | `R` |
| Choisir un bâtiment | `1` … `7` |
| Déplacer la vue | clic milieu, ou `ZQSD` / flèches |
| Zoomer | molette |
| Sauvegarder / charger | `Ctrl+S` / `Ctrl+L` |

## Où lire en premier

`CLAUDE.md` — la règle d'architecture, les contraintes de performance et le
plan par phases. À lire avant de toucher au code.

## Où en est le projet

Phase 1 terminée : grille, caméra, pose/destruction, horloge jour-nuit,
sauvegarde, 22 tests. La phase 2 (convoyeurs et machines) est spécifiée dans
`CLAUDE.md` mais pas encore écrite.

Les versions de dépendances dans `package.json` sont des planchers : si
`npm install` te propose plus récent, prends-le.
