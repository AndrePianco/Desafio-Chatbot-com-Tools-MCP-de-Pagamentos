import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Client as ClientType } from "@modelcontextprotocol/sdk/client/index.js";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3001/mcp";

export interface ToolOpenAI {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

/**
 * Um cliente MCP por sessao (por usuario), carregando o JWT no header do
 * transporte. NUNCA reusar um client entre usuarios diferentes — isso
 * fixaria a identidade do primeiro usuario para todo mundo que reusar o
 * mesmo client.
 */
export async function criarClienteMcp(userJwt: string): Promise<ClientType> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
  const client = new Client({ name: "desafio-backend", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

/** listTools() do MCP -> formato `tools` do OpenAI. Item 2 do checklist. */
export async function descobrirTools(client: ClientType): Promise<ToolOpenAI[]> {
  const { tools } = await client.listTools();
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: (t.inputSchema ?? { type: "object", properties: {} }) as Record<string, unknown>,
    },
  }));
}

/** Executa uma tool e devolve o texto bruto que o modelo vai ler. */
export async function chamarTool(
  client: ClientType,
  nome: string,
  args: Record<string, unknown>,
): Promise<string> {
  const resultado = await client.callTool({ name: nome, arguments: args });
  const blocos = (resultado.content ?? []) as Array<{ type: string; text?: string }>;
  const texto = blocos.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n");
  if (resultado.isError) {
    console.warn(`[mcpClient] tool "${nome}" retornou erro:`, texto);
  }
  return texto || JSON.stringify(resultado);
}
