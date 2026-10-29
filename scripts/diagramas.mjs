/**
 * Docs · Genera un SVG por cada bloque Mermaid de docs/07-diagramas.md en docs/diagramas/.
 * Uso: pnpm docs:diagramas
 * Usa mermaid-cli con el Chrome instalado (sin descargar Chromium). Otra ruta: CHROME=/ruta/al/chrome.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ORIGEN = "docs/07-diagramas.md";
const DESTINO = "docs/diagramas";
const MERMAID_CLI = "@mermaid-js/mermaid-cli@11.4.2";

const chrome = [process.env.CHROME, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((r) => r && existsSync(r));
if (!chrome) {
  console.error("No encontré Chrome. Indica la ruta con CHROME=/ruta/al/chrome pnpm docs:diagramas");
  process.exit(1);
}

// Cada «## N. Título» seguido de un bloque ```mermaid da un archivo «N-titulo.svg».
const texto = readFileSync(ORIGEN, "utf8");
const bloques = [...texto.matchAll(/^## (\d+)\. ([^\n]+)\n[\s\S]*?```mermaid\n([\s\S]*?)```/gm)].map(([, n, titulo, codigo]) => ({
  nombre: `${n.padStart(2, "0")}-${titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  codigo,
}));

const tmp = mkdtempSync(join(tmpdir(), "diagramas-"));
const config = join(tmp, "puppeteer.json");
writeFileSync(config, JSON.stringify({ executablePath: chrome, args: ["--no-sandbox"] }));
mkdirSync(DESTINO, { recursive: true });

try {
  for (const b of bloques) {
    const entrada = join(tmp, `${b.nombre}.mmd`);
    writeFileSync(entrada, b.codigo);
    execFileSync("pnpm", ["dlx", MERMAID_CLI, "-q", "-p", config, "-b", "white", "-i", entrada, "-o", join(DESTINO, `${b.nombre}.svg`)], {
      stdio: ["ignore", "ignore", "inherit"],
      env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "1" },
    });
    console.log(`✓ ${DESTINO}/${b.nombre}.svg`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
