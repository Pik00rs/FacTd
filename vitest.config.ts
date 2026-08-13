import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Les tests ne touchent que /sim : pas de DOM, pas de navigateur, pas de Pixi.
    // Si un test a besoin d'un environnement navigateur, c'est le signe que du
    // code de rendu a fui dans la simulation.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
