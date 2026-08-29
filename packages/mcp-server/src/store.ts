import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Intencao, Transacao, UsuarioSeed } from "@desafio/shared";

/**
 * Estado do dominio de pagamentos -- limite por usuario, intencoes e
 * transacoes. DONO: Pessoa A.
 *
 * Tudo em memoria por decisao de projeto: reiniciar reseta os limites, o
 * que e conveniente para regravar os screenshots.
 */

const caminhoUsuarios = fileURLToPath(
  new URL("../../../data/users.seed.json", import.meta.url),
);

const usuarios: UsuarioSeed[] = JSON.parse(
  readFileSync(caminhoUsuarios, "utf8"),
);

/** user_id -> limite ainda disponivel. Comeca com o limite do seed. */
const limiteRestante = new Map<string, number>(
  usuarios.map((usuario) => [usuario.id, usuario.limite]),
);

/** intencao_id -> intencao. */
const intencoes = new Map<string, Intencao>();

/** Compras aprovadas. Registro historico: so cresce, nunca muda. */
const transacoes: Transacao[] = [];

/** Gera `int_a1b2c3` ou `tx_9f0e11` -- 3 bytes aleatorios em hexadecimal. */
export function idAleatorio(prefixo: "int" | "tx"): string {
  return `${prefixo}_${randomBytes(3).toString("hex")}`;
}

/** Limite ainda disponivel. Usuario desconhecido nao tem credito nenhum. */
export function limiteDe(userId: string): number {
  return limiteRestante.get(userId) ?? 0;
}

/**
 * Debita do limite e devolve quanto sobrou.
 *
 * NAO confere se o valor cabe -- de proposito. Quem decide se a compra e
 * permitida e o tools.ts, na ordem exigida pelo enunciado. Se a trava
 * morasse aqui, o LIMITE_EXCEDIDO deixaria de acontecer na posicao 5 da
 * fila de validacao e a regra de negocio ficaria espalhada em dois lugares.
 */
export function debitar(userId: string, valor: number): number {
  const novo = limiteDe(userId) - valor;
  limiteRestante.set(userId, novo);
  return novo;
}

/** Grava a intencao. Serve para criar e para atualizar -- mesma chave. */
export function salvarIntencao(intencao: Intencao): void {
  intencoes.set(intencao.intencao_id, intencao);
}

/**
 * Devolve a intencao de QUALQUER usuario -- nao confere dono.
 * A checagem de propriedade e responsabilidade de quem chama (tools.ts).
 */
export function buscarIntencao(id: string): Intencao | undefined {
  return intencoes.get(id);
}

export function salvarTransacao(transacao: Transacao): void {
  transacoes.push(transacao);
}

export function listarTransacoes(userId: string): Transacao[] {
  return transacoes.filter((transacao) => transacao.user_id === userId);
}
