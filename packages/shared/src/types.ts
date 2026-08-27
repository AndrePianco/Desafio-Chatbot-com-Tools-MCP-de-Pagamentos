/**
 * CONTRATO COMPARTILHADO -- fonte da verdade entre mcp-server, backend e frontend.
 *
 * Regra do time: mudanca neste arquivo exige avisar o grupo antes.
 * E o unico ponto que as 3 frentes importam.
 */

/* ------------------------------------------------------------------ */
/* Dominio de pagamentos                                               */
/* ------------------------------------------------------------------ */

export type MetodoPagamento = "cartao" | "pix";

export const METODOS_PAGAMENTO: readonly MetodoPagamento[] = ["cartao", "pix"];

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
}

export type StatusIntencao = "pendente" | "pago";

export interface Intencao {
  intencao_id: string;
  /** Dono da intencao. Vem do JWT, NUNCA de argumento de tool. */
  user_id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  /** Calculado no servidor: preco * quantidade. O modelo nao informa valor. */
  valor_total: number;
  status: StatusIntencao;
  /** ISO 8601 */
  criada_em: string;
  /** ISO 8601 -- criada_em + TTL */
  expira_em: string;
}

/** Codigos de erro do fluxo de compra, na ordem em que sao validados. */
export type ErroCompra =
  | "INTENCAO_INVALIDA"
  | "INTENCAO_JA_PAGA"
  | "INTENCAO_EXPIRADA"
  | "METODO_INVALIDO"
  | "LIMITE_EXCEDIDO";

export interface CompraAprovada {
  status: "aprovado";
  transacao_id: string;
  intencao_id: string;
  produto_nome: string;
  quantidade: number;
  valor_debitado: number;
  metodo_pagamento: MetodoPagamento;
  limite_restante: number;
}

export interface CompraRecusada {
  status: "recusado";
  erro: ErroCompra;
  /** Mensagem legivel -- e o que o agente usa para explicar ao usuario. */
  mensagem: string;
}

export type ResultadoCompra = CompraAprovada | CompraRecusada;

export interface Transacao {
  transacao_id: string;
  intencao_id: string;
  user_id: string;
  valor: number;
  metodo_pagamento: MetodoPagamento;
  criada_em: string;
}

/* ------------------------------------------------------------------ */
/* Argumentos das tools MCP                                            */
/* ------------------------------------------------------------------ */

/**
 * IMPORTANTE: nenhuma tool recebe `user_id` (vem do JWT no header do
 * transporte) e nenhuma recebe `valor` (calculado no mcp-server).
 * O modelo nao tem como forjar identidade nem preco.
 */

export type ListarCatalogoArgs = Record<string, never>;

export interface RegistrarIntencaoArgs {
  produto_id: string;
  quantidade: number;
}

export interface RealizarCompraArgs {
  intencao_id: string;
  metodo_pagamento: MetodoPagamento;
}

export const NOMES_TOOLS = [
  "listar_catalogo",
  "registrar_intencao",
  "realizar_compra",
] as const;

export type NomeTool = (typeof NOMES_TOOLS)[number];

/* ------------------------------------------------------------------ */
/* Usuarios / auth                                                     */
/* ------------------------------------------------------------------ */

/** Formato de data/users.seed.json -- lido por backend E mcp-server. */
export interface UsuarioSeed {
  id: string;
  username: string;
  nome: string;
  /** bcrypt. Usado so pelo backend. */
  senha_hash: string;
  /** Limite total de gasto do usuario, em BRL. */
  limite: number;
}

/** Payload do JWT emitido pelo backend e validado pelo mcp-server. */
export interface JwtPayload {
  /** user_id */
  sub: string;
  nome: string;
}

/* ------------------------------------------------------------------ */
/* Conversa (backend <-> frontend)                                     */
/* ------------------------------------------------------------------ */

export interface ToolCall {
  id: string;
  nome: string;
  argumentos: Record<string, unknown>;
  /** Preenchido depois que o mcp-server responde. */
  resultado?: unknown;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** Presente em mensagens `assistant` que pediram tools. */
  tool_calls?: ToolCall[];
  /** Presente em mensagens `tool`, referencia o ToolCall.id. */
  tool_call_id?: string;
}

/* ------------------------------------------------------------------ */
/* API HTTP (backend <-> frontend)                                     */
/* ------------------------------------------------------------------ */

export interface LoginRequest {
  username: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: { id: string; nome: string };
}

export interface ChatRequest {
  mensagem: string;
}

export interface ChatResponse {
  /** So as mensagens novas deste turno (assistant + tool). */
  mensagens: ChatMessage[];
}

export interface ApiError {
  erro: string;
}
