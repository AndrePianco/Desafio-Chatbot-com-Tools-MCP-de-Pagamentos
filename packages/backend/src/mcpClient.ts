import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * Cliente MCP por sessao. DONO: Pessoa B.
 *
 * O JWT do usuario viaja no header do transporte Streamable HTTP. E assim
 * que o mcp-server sabe quem esta chamando sem que o modelo participe da
 * decisao -- ver a decisao de arquitetura em mcp-server/src/index.ts.
 *
 * TODO(Pessoa B):
 *   new StreamableHTTPClientTransport(new URL(process.env.MCP_URL), {
 *     requestInit: { headers: { Authorization: "Bearer " + userJwt } },
 *   })
 */

/** Formato `tools` que o endpoint compativel com OpenAI espera. */
export interface ToolOpenAI {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export async function criarClienteMcp(userJwt: string): Promise<Client> {
  throw new Error("TODO(Pessoa B): criarClienteMcp");
}

/** listTools() do MCP -> formato `tools` do OpenAI. Item 2 do checklist. */
export async function descobrirTools(client: Client): Promise<ToolOpenAI[]> {
  throw new Error("TODO(Pessoa B): descobrirTools");
}

/** Executa uma tool e devolve o texto bruto que o modelo vai ler. */
export async function chamarTool(
  client: Client,
  nome: string,
  args: Record<string, unknown>,
): Promise<string> {
  throw new Error("TODO(Pessoa B): chamarTool");
}
