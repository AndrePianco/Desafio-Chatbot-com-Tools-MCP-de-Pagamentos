import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Produto } from "@desafio/shared";

const caminho = fileURLToPath(
  new URL("../../../data/catalog.seed.json", import.meta.url),
);

/** Catalogo em memoria. Reiniciar o processo restaura o estoque do seed. */
export const catalogo: Produto[] = JSON.parse(readFileSync(caminho, "utf8"));

export function buscarProduto(id: string): Produto | undefined {
  return catalogo.find((p) => p.id === id);
}
