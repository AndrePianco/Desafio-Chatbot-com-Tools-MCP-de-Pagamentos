import type { NextFunction, Request, Response } from "express";
import type { JwtPayload, UsuarioSeed } from "@desafio/shared";

/**
 * Login e emissao de JWT. DONO: Pessoa B.
 *
 * TODO(Pessoa B): carregar data/users.seed.json (mesmo arquivo que o
 * mcp-server le) e assinar com o JWT_SECRET compartilhado -- e a mesma
 * chave que o mcp-server usa para validar.
 */

export const usuarios: UsuarioSeed[] = [];

/** Confere a senha com bcrypt. Devolve null se usuario ou senha nao baterem. */
export function autenticarCredenciais(
  username: string,
  senha: string,
): UsuarioSeed | null {
  throw new Error("TODO(Pessoa B): autenticarCredenciais");
}

/** Assina um JWT com { sub: user_id, nome }. */
export function emitirToken(usuario: UsuarioSeed): string {
  throw new Error("TODO(Pessoa B): emitirToken");
}

/** Anexado a req pelo middleware. */
export interface RequestAutenticada extends Request {
  usuario?: JwtPayload;
  /** O JWT cru -- repassado ao MCP server no header do transporte. */
  token?: string;
}

/** Middleware: protege /api/chat. Sem token valido -> 401. */
export function exigirAuth(
  req: RequestAutenticada,
  res: Response,
  next: NextFunction,
): void {
  throw new Error("TODO(Pessoa B): exigirAuth");
}
