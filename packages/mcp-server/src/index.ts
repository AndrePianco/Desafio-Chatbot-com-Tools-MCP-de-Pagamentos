import type { Request, Response } from "express";

/**
 * Servidor MCP de pagamentos. DONO: Pessoa A.
 *
 * DECISAO DE ARQUITETURA -- nao mudar sem falar com o time:
 * o transporte e Streamable HTTP e NAO stdio. O requisito exige que
 * realizar_compra recuse a intencao de outro usuario; com stdio nao
 * existe header por requisicao, e a unica forma do servidor saber quem
 * chama seria um argumento de tool -- que o modelo pode forjar. Com
 * HTTP, a identidade vem do header Authorization, fora do alcance dele.
 *
 * TODO(Pessoa A):
 *   1. carregar o .env e abortar se JWT_SECRET faltar
 *   2. subir o express e expor POST /mcp
 *   3. por requisicao: autenticar, criar McpServer +
 *      StreamableHTTPServerTransport e chamar registrarTools(server, userId)
 *   4. GET /health para diagnostico rapido
 */

/**
 * Extrai o user_id real do JWT no header Authorization.
 * Devolve null e responde 401 se o token faltar ou for invalido.
 */
export function autenticar(req: Request, res: Response): string | null {
  throw new Error("TODO(Pessoa A): autenticar");
}
