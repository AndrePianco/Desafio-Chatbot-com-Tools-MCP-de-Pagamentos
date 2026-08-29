import "./env.js"; // PRIMEIRO import: carrega o .env antes de todo o resto
import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { JwtPayload } from "@desafio/shared";
import { registrarTools } from "./tools.js";

/**
 * Servidor MCP de pagamentos. DONO: Pessoa A.
 *
 * DECISAO DE ARQUITETURA -- nao mudar sem falar com o time:
 * o transporte e Streamable HTTP e NAO stdio. O requisito exige que
 * realizar_compra recuse a intencao de outro usuario; com stdio nao
 * existe header por requisicao, e a unica forma do servidor saber quem
 * chama seria um argumento de tool -- que o modelo pode forjar. Com
 * HTTP, a identidade vem do header Authorization, fora do alcance dele.
 */

const PORT = Number(process.env.MCP_PORT ?? 3001);

// `?? ""` garante que o tipo seja sempre string. Texto vazio e falso, entao
// a trava abaixo pega tanto "variavel ausente" quanto "variavel vazia".
const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  console.error("[mcp] JWT_SECRET ausente. Copie .env.example para .env.");
  process.exit(1);
}

const app = express();
app.use(express.json());

/**
 * Extrai o user_id real do JWT no header Authorization.
 * Devolve null e ja responde 401 se o token faltar ou for invalido.
 *
 * Esta e a unica fonte de identidade do pacote: vem do envelope da
 * requisicao, nunca do conteudo que o modelo escreve.
 */
function autenticar(req: Request, res: Response): string | null {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Authorization ausente" });
    return null;
  }

  try {
    // O tipo que o jsonwebtoken devolve e amplo demais para encaixar direto
    // no nosso JwtPayload; passar por `unknown` e a forma de dizer ao
    // TypeScript "eu sei o formato". A garantia real vem da assinatura.
    const payload = jwt.verify(
      header.slice(7),
      JWT_SECRET,
    ) as unknown as JwtPayload;

    if (!payload?.sub) {
      res.status(401).json({ erro: "JWT sem user_id" });
      return null;
    }
    return payload.sub;
  } catch {
    res.status(401).json({ erro: "JWT invalido" });
    return null;
  }
}

app.post("/mcp", async (req, res) => {
  const userId = autenticar(req, res);
  if (!userId) return; // cracha invalido: para aqui, nada mais roda

  // Modo stateless: um servidor + transporte por requisicao, isolado por
  // usuario. Nenhuma requisicao herda nada da anterior.
  const server = new McpServer({ name: "pagamentos-mcp", version: "1.0.0" });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    // O userId fica preso dentro das tools (closure): elas ja nascem
    // sabendo de quem e a compra, sem receber isso como argumento.
    registrarTools(server, userId);
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (erro) {
    console.error("[mcp] erro ao tratar requisicao:", erro);
    if (!res.headersSent) res.status(500).json({ erro: "Erro interno" });
  }
});

// Modo stateless nao suporta SSE de servidor nem encerramento de sessao.
app.get("/mcp", (_req, res) => res.status(405).json({ erro: "Use POST" }));
app.delete("/mcp", (_req, res) => res.status(405).json({ erro: "Use POST" }));

/** Diagnostico: nao faz parte do MCP e nao pede cracha. */
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[mcp] Streamable HTTP em http://localhost:${PORT}/mcp`);
});
