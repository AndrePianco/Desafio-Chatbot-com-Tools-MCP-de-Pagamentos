import type { Produto } from "@desafio/shared";

/**
 * Catalogo de produtos. DONO: Pessoa A.
 *
 * TODO(Pessoa A): carregar data/catalog.seed.json e expor a busca por id.
 * O preco vive aqui e so aqui -- nenhuma tool recebe valor como argumento.
 */

export const catalogo: Produto[] = [];

export function buscarProduto(id: string): Produto | undefined {
  throw new Error("TODO(Pessoa A): buscarProduto");
}
