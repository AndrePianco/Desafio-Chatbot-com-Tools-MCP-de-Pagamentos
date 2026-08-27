import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { JwtPayload, UsuarioSeed } from "@desafio/shared";

const caminho = fileURLToPath(
  new URL("../../../data/users.seed.json", import.meta.url),
);

export const usuarios: UsuarioSeed[] = JSON.parse(
  readFileSync(caminho, "utf8"),
);

const JWT_SECRET = process.env.JWT_SECRET!;

export function autenticarCredenciais(
  username: string,
  senha: string,
): UsuarioSeed | null {
  const usuario = usuarios.find((u) => u.username === username);
  if (!usuario) return null;
  return bcrypt.compareSync(senha, usuario.senha_hash) ? usuario : null;
}

export function emitirToken(usuario: UsuarioSeed): string {
  const payload: JwtPayload = { sub: usuario.id, nome: usuario.nome };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

/** Anexado a req pelo middleware. */
export interface RequestAutenticada extends Request {
  usuario?: JwtPayload;
  /** O JWT cru -- repassado ao MCP server no header do transporte. */
  token?: string;
}

export function exigirAuth(
  req: RequestAutenticada,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Nao autenticado" });
    return;
  }
  const token = header.slice(7);
  try {
    req.usuario = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ erro: "Token invalido ou expirado" });
  }
}
