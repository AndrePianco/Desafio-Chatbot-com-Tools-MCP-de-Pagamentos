import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ChatMessage } from "@desafio/shared";

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
