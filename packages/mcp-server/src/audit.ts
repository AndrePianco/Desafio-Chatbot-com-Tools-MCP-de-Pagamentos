import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Audit log -- uma linha JSON por chamada de tool. DONO: Pessoa A.
 *
 * Extra do desafio, barato: vira evidencia nos screenshots de entrega.
 * O arquivo fica na raiz do projeto e esta no .gitignore.
 */

const caminho = fileURLToPath(new URL("../../../audit.log", import.meta.url));

export function auditar(entrada: {
  user_id: string;
  tool: string;
  args: unknown;
  resultado: unknown;
}): void {
  const linha = JSON.stringify({ ts: new Date().toISOString(), ...entrada });

  // Auditoria falhando nao pode derrubar a compra: avisa e segue.
  try {
    appendFileSync(caminho, linha + "\n");
  } catch (erro) {
    console.error("[audit] falha ao escrever:", erro);
  }

  console.log(`[tool] ${entrada.user_id} -> ${entrada.tool}`);
}
