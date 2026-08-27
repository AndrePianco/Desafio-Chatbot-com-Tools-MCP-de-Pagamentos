import "dotenv/config";
import cors from "cors";
import express from "express";
import type {
  ChatRequest,
  ChatResponse,
  LoginRequest,
  LoginResponse,
} from "@desafio/shared";
import {
  autenticarCredenciais,
  emitirToken,
  exigirAuth,
  usuarios,
  type RequestAutenticada,
} from "./auth.js";
import { criarClienteMcp, descobrirTools } from "./mcpClient.js";
import { obterSessao } from "./sessions.js";
import { MODELO, responder } from "./agent.js";

const PORT = Number(process.env.BACKEND_PORT ?? 3000);

if (!process.env.JWT_SECRET) {
  console.error("[backend] JWT_SECRET ausente. Copie .env.example para .env.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/login", (req, res) => {
  const { username, senha } = req.body as LoginRequest;
  const usuario = autenticarCredenciais(username ?? "", senha ?? "");
  if (!usuario) {
    res.status(401).json({ erro: "Usuario ou senha invalidos" });
    return;
  }
  const resposta: LoginResponse = {
    token: emitirToken(usuario),
    usuario: { id: usuario.id, nome: usuario.nome },
  };
  res.json(resposta);
});

app.post("/api/chat", exigirAuth, async (req: RequestAutenticada, res) => {
  const { mensagem } = req.body as ChatRequest;
  if (!mensagem?.trim()) {
    res.status(400).json({ erro: "mensagem vazia" });
    return;
  }

  const sessao = obterSessao(req.usuario!.sub);
  try {
    // Cliente MCP por sessao, com o JWT deste usuario no header.
    sessao.mcp ??= await criarClienteMcp(req.token!);
    const mensagens = await responder(sessao, sessao.mcp, mensagem);
    const resposta: ChatResponse = { mensagens };
    res.json(resposta);
  } catch (e) {
    console.error("[backend] erro no chat:", e);
    res.status(500).json({ erro: "Falha ao processar a mensagem" });
  }
});

app.get("/api/historico", exigirAuth, (req: RequestAutenticada, res) => {
  res.json({ mensagens: obterSessao(req.usuario!.sub).historico });
});

app.listen(PORT, async () => {
  console.log(`[backend] http://localhost:${PORT} (modelo: ${MODELO})`);
  // Descoberta de tools no boot -- item 2 do checklist do desafio.
  try {
    const primeiro = usuarios[0];
    if (!primeiro) throw new Error("users.seed.json vazio");
    const client = await criarClienteMcp(emitirToken(primeiro));
    const tools = await descobrirTools(client);
    console.log(
      `[backend] tools MCP descobertas (${tools.length}):`,
      tools.map((t) => t.function.name).join(", "),
    );
    await client.close();
  } catch (e) {
    console.warn(
      "[backend] nao consegui descobrir as tools (mcp-server no ar?):",
      (e as Error).message,
    );
  }
});
