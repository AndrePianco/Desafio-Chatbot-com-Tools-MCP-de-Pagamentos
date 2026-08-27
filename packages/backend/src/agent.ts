import OpenAI from "openai";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ChatMessage } from "@desafio/shared";
import { chamarTool, descobrirTools } from "./mcpClient.js";
import type { Sessao } from "./sessions.js";

const MAX_ITERACOES = Number(process.env.MAX_ITERACOES_AGENTE ?? 5);

export const openai = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama ignora, mas o SDK exige
});

export const MODELO = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

/**
 * Sem limites, precos ou ids no prompt: o limite vive no mcp-server e e
 * ele quem recusa. O prompt so orienta o fluxo.
 */
export const SYSTEM_PROMPT = `Voce e um assistente de compras. Use SEMPRE as tools para qualquer informacao sobre produtos, precos ou pagamentos -- nunca invente dados.

Fluxo correto:
1. listar_catalogo para mostrar o que ha a venda.
2. registrar_intencao quando o usuario escolher produto e quantidade. O servidor devolve o intencao_id e o valor_total.
3. realizar_compra com o intencao_id retornado e o metodo escolhido (cartao ou pix).

Nunca invente um intencao_id, um preco ou um valor. Se uma tool recusar a operacao, explique o motivo ao usuario em portugues claro e sugira o proximo passo.`;

/**
 * Loop do agente -- DONO: Pessoa B.
 *
 * TODO(Pessoa B): trocar o eco abaixo pelo loop real:
 *   1. tools = await descobrirTools(mcp)
 *   2. enviar [system, ...historico completo] ao Ollama com `tools`
 *   3. se a resposta tiver tool_calls: chamarTool() para cada uma,
 *      anexar a mensagem assistant (com tool_calls) e as mensagens
 *      role:"tool" ao historico, e repetir
 *   4. parar em MAX_ITERACOES
 *   5. devolver as mensagens novas deste turno
 */
export async function responder(
  sessao: Sessao,
  mcp: Client,
  mensagem: string,
): Promise<ChatMessage[]> {
  sessao.historico.push({ role: "user", content: mensagem });

  const tools = await descobrirTools(mcp);
  const resposta: ChatMessage = {
    role: "assistant",
    content:
      `[STUB do scaffold] Recebi: "${mensagem}". ` +
      `Tenho ${tools.length} tools disponiveis (${tools
        .map((t) => t.function.name)
        .join(", ")}). O loop real contra o Ollama e a tarefa da Pessoa B.`,
  };

  sessao.historico.push(resposta);
  void MAX_ITERACOES;
  void chamarTool;
  return [resposta];
}
