import type {
  ChatRequest,
  ChatResponse,
  LoginRequest,
  LoginResponse,
} from "@desafio/shared";

const CHAVE_TOKEN = "desafio_token";
const CHAVE_NOME = "desafio_nome";

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function lerNome(): string {
  return localStorage.getItem(CHAVE_NOME) ?? "";
}

export function encerrarSessao(): void {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_NOME);
}

async function json<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({ erro: "Falha" }));
    throw new Error(corpo.erro ?? `HTTP ${resposta.status}`);
  }
  return resposta.json() as Promise<T>;
}

export async function login(corpo: LoginRequest): Promise<LoginResponse> {
  const resposta = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await json<LoginResponse>(resposta);
  localStorage.setItem(CHAVE_TOKEN, dados.token);
  localStorage.setItem(CHAVE_NOME, dados.usuario.nome);
  return dados;
}

export async function enviarMensagem(mensagem: string): Promise<ChatResponse> {
  const corpo: ChatRequest = { mensagem };
  const resposta = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lerToken()}`,
    },
    body: JSON.stringify(corpo),
  });
  return json<ChatResponse>(resposta);
}
