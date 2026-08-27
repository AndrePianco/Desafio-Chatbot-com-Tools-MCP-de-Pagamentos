import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Intencao, Transacao, UsuarioSeed } from "@desafio/shared";

/**
 * Estado do dominio de pagamentos. Tudo em memoria por decisao de projeto:
 * reiniciar reseta os limites, o que facilita regravar os screenshots.
 *
 * DONO: Pessoa A (mcp-server).
 */

const caminhoUsuarios = fileURLToPath(
  new URL("../../../data/users.seed.json", import.meta.url),
);

const usuarios: UsuarioSeed[] = JSON.parse(
  readFileSync(caminhoUsuarios, "utf8"),
);

/** user_id -> limite ainda disponivel. */
const limiteRestante = new Map<string, number>(
  usuarios.map((u) => [u.id, u.limite]),
);

const intencoes = new Map<string, Intencao>();
const transacoes: Transacao[] = [];

export function idAleatorio(prefixo: "int" | "tx"): string {
  return `${prefixo}_${randomBytes(3).toString("hex")}`;
}

export function limiteDe(userId: string): number {
  return limiteRestante.get(userId) ?? 0;
}

export function debitar(userId: string, valor: number): number {
  const novo = limiteDe(userId) - valor;
  limiteRestante.set(userId, novo);
  return novo;
}

export function salvarIntencao(intencao: Intencao): void {
  intencoes.set(intencao.intencao_id, intencao);
}

export function buscarIntencao(id: string): Intencao | undefined {
  return intencoes.get(id);
}

export function salvarTransacao(transacao: Transacao): void {
  transacoes.push(transacao);
}

export function listarTransacoes(userId: string): Transacao[] {
  return transacoes.filter((t) => t.user_id === userId);
}
