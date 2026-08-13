import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * La règle d'or du projet est appliquée ici par la machine, pas par la
 * discipline. Un agent qui écrit du code ne peut pas casser la séparation
 * sim / rendu sans que `npm run lint` échoue.
 */
export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/sim/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["pixi.js", "**/render/**", "**/ui/**", "../render/*", "../ui/*"],
              message:
                "/sim ne doit rien connaître du rendu ni de l'interface. Si tu as besoin d'une donnée du rendu ici, c'est que la donnée est mal placée.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "/sim doit tourner en headless (tests Node)." },
        { name: "document", message: "/sim doit tourner en headless (tests Node)." },
        { name: "performance", message: "/sim avance par ticks, jamais par horloge murale." },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message:
            "Aléatoire non déterministe interdit dans /sim. Utiliser nextRandom(world) de src/sim/rng.ts.",
        },
      ],
    },
  },

  {
    files: ["src/render/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/ui/**", "../ui/*"],
              message: "Le rendu ne pilote pas l'interface. C'est main.ts qui relie les deux.",
            },
          ],
        },
      ],
    },
  },
);
