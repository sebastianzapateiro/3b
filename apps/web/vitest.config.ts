import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Pruebas de la lógica pura (sin base de datos ni red): `pnpm test`. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
