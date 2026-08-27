import "dotenv/config";
import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { JwtPayload } from "@desafio/shared";
import { registrarTools } from "./tools.js";

const PORT = Number(process.env.MCP_PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("[mcp] JWT_SECRET ausente. Copie .env.example para .env.");
  process.exit(1);
}

const app = express();
app.use(express.json());

/**
 * A identidade do chamador vem do header Authorization do transporte
 * Streamable HTTP -- fora do alcance do modelo. E por isso que o
 * transporte NAO e stdio: com stdio nao ha header por requisicao e o
 * user_id teria que virar argumento de tool, que o LLM pode forjar.
 */
function autenticar(req: Request, res: Response): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Authorization ausente" });
    return null;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET!) as JwtPayload;
    return payload.sub;
  } catch {
    res.status(401).json({ erro: "JWT invalido" });
    return null;
  }
}

app.post("/mcp", async (req, res) => {
  const userId = autenticar(req, res);
  if (!userId) return;

  // Modo stateless: um servidor + transporte por requisicao, isolado por
  // usuario. Simples e sem sessao MCP para gerenciar.
  const server = new McpServer({ name: "pagamentos-mcp", version: "1.0.0" });
  registrarTools(server, userId);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error("[mcp] erro ao tratar requisicao:", e);
    if (!res.headersSent) res.status(500).json({ erro: "Erro interno" });
  }
});

// Modo stateless nao suporta SSE de servidor nem encerramento de sessao.
app.get("/mcp", (_req, res) => res.status(405).json({ erro: "Use POST" }));
app.delete("/mcp", (_req, res) => res.status(405).json({ erro: "Use POST" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[mcp] Streamable HTTP em http://localhost:${PORT}/mcp`);
});
