import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const caminho = fileURLToPath(new URL("../../../audit.log", import.meta.url));

/**
 * Append-only: uma linha JSON por chamada de tool.
 * Extra do desafio -- barato e vira evidencia nos screenshots.
 */
export function auditar(entrada: {
  user_id: string;
  tool: string;
  args: unknown;
  resultado: unknown;
}): void {
  const linha = JSON.stringify({ ts: new Date().toISOString(), ...entrada });
  try {
    appendFileSync(caminho, linha + "\n");
  } catch (e) {
    console.error("[audit] falha ao escrever:", e);
  }
  console.log(`[tool] ${entrada.user_id} -> ${entrada.tool}`);
}
