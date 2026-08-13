# Factory TD — contrat d'architecture

Jeu 2D de production et de défense. On construit une usine sur une grille, on
l'améliore, et on la défend contre des vagues qui attaquent le jour et la nuit,
avec un assaut lourd tous les 7 jours. Pas de personnage jouable : caméra libre.

TypeScript, PixiJS pour le rendu, simulation maison. Aucun moteur de jeu.

## La règle d'or

**`src/sim/` ne connaît ni le rendu, ni l'interface, ni le navigateur.**

```
src/sim/     → logique pure. Tourne dans Node. Testée en headless.
src/render/  → lit la simulation et dessine. N'écrit JAMAIS dedans.
src/ui/      → DOM/HTML par-dessus le canvas. Ne touche pas à la simulation.
src/data/    → JSON : bâtiments, recettes, vagues. Pas de logique.
src/main.ts  → le seul endroit qui relie les trois.
```

`npm run lint` fait échouer toute violation : `/sim` ne peut pas importer
`pixi.js`, `/render`, `/ui`, ni utiliser `window`, `document`, `performance`
ou `Math.random`. Si une règle te gêne, **le code est mal placé — ne désactive
pas la règle.**

Pourquoi c'est non négociable : cette séparation est ce qui permet de tester la
simulation sans navigateur, de sauvegarder en quelques kilo-octets, et de
porter le coeur en WASM le jour où JS plafonnera. La perdre coûterait une
réécriture.

## Commandes

```bash
npm run dev        # serveur de développement
npm test           # tests de la simulation (headless, rapide)
npm run typecheck  # tsc --noEmit
npm run lint       # dont la règle d'architecture ci-dessus
npm run check      # les trois — à lancer avant de dire qu'une tâche est finie
```

**Toute modification de `src/sim/` doit s'accompagner d'un test dans `tests/`.**
C'est la boucle qui rend ce projet utilisable par un agent : écrire, lancer
`npm test`, lire l'échec, corriger, recommencer — sans intervention humaine.

## Règles de performance

Un jeu d'usine finit avec des dizaines de milliers d'entités mises à jour
60 fois par seconde. Les habitudes du développement web classique le tuent.

- **TypedArrays parallèles, pas de tableaux d'objets.** Voir
  `src/sim/buildings.ts` : `type[]`, `x[]`, `y[]`… Un bâtiment est un `number`,
  jamais une référence.
- **Zéro allocation dans un tick.** Pas de `.map`, `.filter`, `.forEach`, pas
  de littéral d'objet, pas de closure, pas de `Set`/`Map` temporaire dans le
  chemin chaud. Boucles `for` classiques.
- **Le coût du rendu suit la taille de l'écran, pas celle de l'usine.** On itère
  sur les cases visibles, jamais sur tous les bâtiments.
- **Déterminisme.** `Math.random()` est interdit dans `/sim`. Utiliser
  `nextRandom(world)`. Deux mondes de même graine doivent être identiques
  après N ticks — c'est testé.
- Un tick ne reçoit **aucun** paramètre de temps. Pas de `deltaTime` dans
  `/sim`, jamais.

## Ce qui est fait — phase 1

- Grille 256×256 en tableaux plats, terrain généré depuis la graine
- Caméra libre : molette, clic milieu, ZQSD
- Pose et destruction, empreintes multi-cases avec rotation, aperçu fantôme
- Horloge jour/nuit, calendrier des assauts tous les 7 jours
- Sauvegarde/chargement (graine + bâtiments, le terrain est régénéré)
- 22 tests

## Prochaine étape — phase 2 : la production

C'est le coeur du jeu. Rien d'autre ne compte tant que ça ne tourne pas bien.

### Convoyeurs — le modèle à implémenter

**Ne jamais simuler un objet transporté comme une entité avec une position.**
100 000 objets × 60 ticks = 6 millions de mises à jour par seconde. C'est
l'erreur qui a tué d'innombrables projets du genre.

Modèle correct, celui de Factorio :

- Un **segment** est une suite de convoyeurs contigus dans le même sens.
  Il est recalculé à la pose/destruction, pas à chaque tick.
- Chaque segment porte **2 voies** (gauche / droite).
- Une voie est une liste d'objets stockés en **écarts** :
  `items: [{ gap, type }]`, où `gap` est la distance depuis l'objet précédent
  (ou depuis la tête du segment pour le premier).
- Avancer la voie = **décrémenter le `gap` du premier objet uniquement**.
  Tout le reste suit gratuitement. O(1) par segment et par tick au lieu de
  O(n) par objet.
- Une voie saturée : le premier `gap` atteint 0 et rien ne bouge — le blocage
  se propage tout seul, sans code dédié.

### Machines

- État par machine dans les TypedArrays existants (`progress` est déjà là)
- Recettes en JSON dans `src/data/` : entrées, sorties, durée en ticks
- Ne pas parcourir toutes les machines chaque tick quand ça deviendra lourd :
  passer à une file d'événements indexée par tick d'échéance

## Suite du plan

- **Phase 3** — arbre de technologies, tout piloté par `src/data/`
- **Phase 4** — combat : tourelles, pathfinding des ennemis vers les
  structures. *Point de design central : la défense doit consommer ce que
  l'usine produit* (munitions, énergie, réparations). Sans ce couplage, on a
  deux jeux collés au lieu d'un.
- **Phase 5** — directeur de vagues, réglé par `src/data/waves.json`, jamais
  en dur dans le code
- **Phase 6** — atlas de sprites, remplacement des rectangles de substitution,
  passe d'interface

## Ce qu'il ne faut pas faire

- Ajouter une bibliothèque d'ECS. Le modèle SoA maison suffit et reste lisible.
- Introduire React ou un framework d'UI. Le HUD est du DOM, ça convient.
- Mettre des valeurs d'équilibrage en dur dans le code : elles vont dans
  `src/data/`.
- Optimiser avant d'avoir mesuré. La jauge « simulation » du HUD affiche les
  ticks par seconde réels : c'est l'indicateur de référence.
- Commencer la phase 4 avant que la phase 2 ne tourne à 500 machines sans
  perdre de ticks.
