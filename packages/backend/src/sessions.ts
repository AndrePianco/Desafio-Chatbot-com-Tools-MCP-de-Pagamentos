import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ChatMessage } from "@desafio/shared";

/**
 * Historico de conversa por usuario, em memoria.
 * O historico COMPLETO e reenviado ao modelo a cada turno -- incluindo
 * as mensagens assistant com tool_calls e as mensagens role:"tool".
 */
export interface Sessao {
  userId: string;
  historico: ChatMessage[];
  mcp?: Client;
}

const sessoes = new Map<string, Sessao>();

export function obterSessao(userId: string): Sessao {
  let sessao = sessoes.get(userId);
  if (!sessao) {
    sessao = { userId, historico: [] };
    sessoes.set(userId, sessao);
  }
  return sessao;
}

export function limparSessao(userId: string): void {
  sessoes.delete(userId);
}
