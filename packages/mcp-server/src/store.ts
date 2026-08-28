import type { Intencao, Transacao } from "@desafio/shared";

/**
 * Estado do dominio de pagamentos -- limite por usuario, intencoes e
 * transacoes. DONO: Pessoa A.
 *
 * TODO(Pessoa A): escolher as estruturas de dados e carregar os limites
 * iniciais de data/users.seed.json (mesmo arquivo que o backend le).
 */

/** Gera um id novo: `int_` + 6 hex, ou `tx_` + 6 hex. */
export function idAleatorio(prefixo: "int" | "tx"): string {
  throw new Error("TODO(Pessoa A): idAleatorio");
}

/** Limite ainda disponivel do usuario. */
export function limiteDe(userId: string): number {
  throw new Error("TODO(Pessoa A): limiteDe");
}

/** Debita do limite e devolve quanto sobrou. */
export function debitar(userId: string, valor: number): number {
  throw new Error("TODO(Pessoa A): debitar");
}

/** Grava a intencao (cria ou atualiza). */
export function salvarIntencao(intencao: Intencao): void {
  throw new Error("TODO(Pessoa A): salvarIntencao");
}

export function buscarIntencao(id: string): Intencao | undefined {
  throw new Error("TODO(Pessoa A): buscarIntencao");
}

export function salvarTransacao(transacao: Transacao): void {
  throw new Error("TODO(Pessoa A): salvarTransacao");
}

export function listarTransacoes(userId: string): Transacao[] {
  throw new Error("TODO(Pessoa A): listarTransacoes");
}
