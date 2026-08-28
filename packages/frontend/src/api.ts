import type { ChatResponse, LoginRequest, LoginResponse } from "@desafio/shared";

/**
 * Cliente HTTP do backend. DONO: Pessoa C.
 *
 * O Vite faz proxy de /api para localhost:3000 (ver vite.config.ts), entao
 * as chamadas podem usar caminho relativo.
 *
 * TODO(Pessoa C): guardar o token do login e mandar em
 * `Authorization: Bearer <token>` nas chamadas protegidas.
 */

export function lerToken(): string | null {
  throw new Error("TODO(Pessoa C): lerToken");
}

export function lerNome(): string {
  throw new Error("TODO(Pessoa C): lerNome");
}

export function encerrarSessao(): void {
  throw new Error("TODO(Pessoa C): encerrarSessao");
}

/** POST /api/login -- guarda o token e devolve o usuario. */
export async function login(corpo: LoginRequest): Promise<LoginResponse> {
  throw new Error("TODO(Pessoa C): login");
}

/** POST /api/chat -- devolve so as mensagens novas do turno. */
export async function enviarMensagem(mensagem: string): Promise<ChatResponse> {
  throw new Error("TODO(Pessoa C): enviarMensagem");
}
