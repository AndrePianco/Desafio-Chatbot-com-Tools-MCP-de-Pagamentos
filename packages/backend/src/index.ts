/**
 * API HTTP do backend. DONO: Pessoa B.
 *
 * Ponte entre o frontend, o Ollama e o mcp-server. O modelo nunca fala
 * com o mcp-server: quem chama as tools e este processo, carregando o JWT
 * do usuario logado no header do transporte.
 *
 * TODO(Pessoa B):
 *   POST /api/login      credenciais -> { token, usuario }
 *   POST /api/chat       protegida por exigirAuth; cliente MCP por sessao
 *                        com o JWT do usuario; chama responder()
 *   GET  /api/historico  protegida; devolve o historico da sessao
 *
 *   No boot: descobrir as tools do mcp-server e logar os 3 nomes -- e o
 *   item 2 do checklist ("tools sendo descobertas pelo agente").
 */

export {};
