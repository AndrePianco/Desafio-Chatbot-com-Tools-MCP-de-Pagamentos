import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Produto } from "@desafio/shared";

/**
 * Catalogo de produtos. DONO: Pessoa A.
 *
 * O preco vive aqui e so aqui -- nenhuma tool recebe valor como argumento.
 * Carregado uma vez quando o servidor liga; reiniciar restaura o seed.
 */

/** Caminho a partir DESTE arquivo, nao de onde o processo foi iniciado. */
const caminho = fileURLToPath(
  new URL("../../../data/catalog.seed.json", import.meta.url),
);

export const catalogo: Produto[] = JSON.parse(readFileSync(caminho, "utf8"));

/** Devolve o produto, ou undefined se o id nao existir no catalogo. */
export function buscarProduto(id: string): Produto | undefined {
  return catalogo.find((produto) => produto.id === id);
}
