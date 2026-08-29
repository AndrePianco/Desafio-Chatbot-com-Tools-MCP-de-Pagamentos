import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { JwtPayload, UsuarioSeed } from "@desafio/shared";

const caminhoSeed = fileURLToPath(
  new URL("../../../data/users.seed.json", import.meta.url),
);

export const usuarios: UsuarioSeed[] = JSON.parse(readFileSync(caminhoSeed, "utf8"));

function segredo(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET ausente — copie .env.example para .env");
  return s;
}

export function autenticarCredenciais(username: string, senha: string): UsuarioSeed | null {
  const usuario = usuarios.find((u) => u.username === username);
  if (!usuario) return null;
  return bcrypt.compareSync(senha, usuario.senha_hash) ? usuario : null;
}

export function emitirToken(usuario: UsuarioSeed): string {
  const payload: JwtPayload = { sub: usuario.id, nome: usuario.nome };
  return jwt.sign(payload, segredo(), { expiresIn: "8h" });
}

export interface RequestAutenticada extends Request {
  usuario?: JwtPayload;
  /** O JWT cru — repassado ao MCP server no header do transporte (PB-5). */
  token?: string;
}

export function exigirAuth(req: RequestAutenticada, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ erro: "não autenticado" });
    return;
  }
  const token = header.slice("Bearer ".length);
  try {
    req.usuario = jwt.verify(token, segredo()) as JwtPayload;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ erro: "token inválido ou expirado" });
  }
}
