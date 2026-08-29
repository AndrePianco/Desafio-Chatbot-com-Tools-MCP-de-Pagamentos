import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ChatMessage } from "@desafio/shared";
import type { Sessao } from "./sessions.js";

/**
 * Loop do agente contra o Ollama. DONO: Pessoa B.
 *
 * O Ollama expoe endpoint compativel com OpenAI, entao usa-se o SDK
 * `openai` apontado para ele -- sem lib extra:
 *   new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" })
 *
 * Modelo: qwen2.5:7b (bom tool calling para o tamanho).
 * Fallback: llama3.1:8b. Abaixo de 7B costuma falhar em tool calling
 * encadeado -- nao vale o risco com esse prazo.
 *
 * TODO(Pessoa B): o system prompt NAO deve conter limites, precos nem ids
 * hardcoded. O limite vive no mcp-server e e ele quem recusa; o prompt so
 * orienta o fluxo listar -> registrar -> pagar.
 */
export const SYSTEM_PROMPT = "";

/**
 * TODO(Pessoa B) -- o loop, por turno:
 *   1. tools = await descobrirTools(mcp)
 *   2. enviar [system, ...historico completo] ao Ollama com `tools`
 *   3. se a resposta tiver tool_calls: chamarTool() para cada uma, anexar
 *      a mensagem assistant (com tool_calls) e as mensagens role:"tool"
 *      ao historico, e repetir
 *   4. parar em MAX_ITERACOES (guarda contra loop infinito)
 *   5. persistir o historico na sessao e devolver as mensagens novas
 */
export async function responder(
  sessao: Sessao,
  mcp: Client,
  mensagem: string,
): Promise<ChatMessage[]> {
  throw new Error("TODO(Pessoa B): responder");
}
