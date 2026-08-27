import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3001/mcp";

/**
 * Um cliente MCP por sessao, carregando o JWT do usuario no header do
 * transporte. E assim que o mcp-server sabe quem esta chamando sem que
 * o modelo participe da decisao.
 */
export async function criarClienteMcp(userJwt: string): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: {
      headers: { Authorization: `Bearer ${userJwt}` },
    },
  });
  const client = new Client({ name: "desafio-backend", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

/** Formato MCP (JSON Schema) -> formato `tools` do OpenAI/Ollama. */
export async function descobrirTools(client: Client) {
  const { tools } = await client.listTools();
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: (t.inputSchema ?? {
        type: "object",
        properties: {},
      }) as Record<string, unknown>,
    },
  }));
}

/** Executa uma tool e devolve o texto bruto que o modelo vai ler. */
export async function chamarTool(
  client: Client,
  nome: string,
  args: Record<string, unknown>,
): Promise<string> {
  const resposta = await client.callTool({ name: nome, arguments: args });
  const conteudo = resposta.content as Array<{ type: string; text?: string }>;
  return conteudo
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("\n");
}
