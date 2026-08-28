import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ChatMessage } from "@desafio/shared";

/**
 * Historico de conversa por usuario, em memoria. DONO: Pessoa B.
 *
 * O historico COMPLETO e reenviado ao modelo a cada turno -- incluindo as
 * mensagens assistant com tool_calls e as mensagens role:"tool" com os
 * resultados. E o item 10 do checklist do desafio.
 */
export interface Sessao {
  userId: string;
  historico: ChatMessage[];
  mcp?: Client;
}

/** Devolve a sessao do usuario, criando na primeira vez. */
export function obterSessao(userId: string): Sessao {
  throw new Error("TODO(Pessoa B): obterSessao");
}

export function limparSessao(userId: string): void {
  throw new Error("TODO(Pessoa B): limparSessao");
}
