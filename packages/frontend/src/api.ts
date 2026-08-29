import type { ChatMessage, ChatResponse, LoginRequest, LoginResponse } from "@desafio/shared";

const TOKEN_KEY = "chatbot_token";
const NOME_KEY  = "chatbot_nome";

export function lerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function lerNome(): string {
  return localStorage.getItem(NOME_KEY) ?? "";
}

export function encerrarSessao(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NOME_KEY);
}

const USUARIOS_MOCK = [
  { id: "usr_001", username: "rick",  nome: "Rick",  senha: "rick123",  limite: 1500 },
  { id: "usr_002", username: "andre", nome: "Andre", senha: "andre123", limite: 800  },
  { id: "usr_003", username: "ana",   nome: "Ana",   senha: "ana123",   limite: 300  },
];

const CATALOGO_MOCK = [
  { id: "prod_001", nome: "Fone Bluetooth Aurora",    preco: 249.90,  moeda: "BRL", estoque: 12 },
  { id: "prod_002", nome: "Teclado Mecânico Kappa",   preco: 419.00,  moeda: "BRL", estoque: 7  },
  { id: "prod_003", nome: "Mouse Vertical Ergo",      preco: 189.50,  moeda: "BRL", estoque: 20 },
  { id: "prod_004", nome: "Monitor 27\" QHD 144Hz",   preco: 1899.00, moeda: "BRL", estoque: 3  },
  { id: "prod_005", nome: "Webcam Studio 1080p",      preco: 329.90,  moeda: "BRL", estoque: 15 },
  { id: "prod_006", nome: "Cadeira Ergonômica Lumen", preco: 1290.00, moeda: "BRL", estoque: 5  },
];

let saldoMock = 1500;
const intencoesMock = new Map<string, {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_total: number;
  expira_em: string;
}>();

function gerarId(prefixo: string) {
  return `${prefixo}_${Math.random().toString(36).slice(2, 8)}`;
}

function loginMock(username: string, senha: string): LoginResponse {
  const usuario = USUARIOS_MOCK.find(u => u.username === username && u.senha === senha);
  if (!usuario) throw Object.assign(new Error("Usuário ou senha inválidos."), { status: 401 });
  saldoMock = usuario.limite;
  intencoesMock.clear();
  return {
    token: "mock-token-" + usuario.id,
    usuario: { id: usuario.id, nome: usuario.nome },
  };
}

function chatMock(mensagem: string): ChatResponse {
  const txt = mensagem.toLowerCase();

  if (/(catálogo|catalogo|produto|venda|vende|tem|disponível|disponivel|mostr|list)/i.test(txt)) {
    const tcId = gerarId("tc");
    return {
      mensagens: [
        {
          role: "assistant",
          content: "",
          tool_calls: [{ id: tcId, nome: "listar_catalogo", argumentos: {}, resultado: { produtos: CATALOGO_MOCK } }],
        },
        { role: "tool", content: JSON.stringify({ produtos: CATALOGO_MOCK }), tool_call_id: tcId },
        {
          role: "assistant",
          content:
            "Aqui estão os produtos disponíveis:\n\n" +
            CATALOGO_MOCK.map((p, i) =>
              `${i + 1}. **${p.nome}** — R$ ${p.preco.toFixed(2)} (${p.estoque} em estoque)`
            ).join("\n") +
            "\n\nQual deles você gostaria de comprar?",
        },
      ],
    };
  }

  if (/(comprar|quero|pegar|levar|item|produto [0-9]|prod_)/i.test(txt)) {
    let produto = CATALOGO_MOCK[0]!;
    for (let i = 0; i < CATALOGO_MOCK.length; i++) {
      const p = CATALOGO_MOCK[i]!;
      if (
        txt.includes(String(i + 1)) ||
        txt.includes(p.id) ||
        txt.includes(p.nome.toLowerCase().split(" ")[0]!)
      ) {
        produto = p;
        break;
      }
    }
    const quantidade = 1;
    const valor_total = produto.preco * quantidade;
    const intencao_id = gerarId("int");
    const expira_em = new Date(Date.now() + 5 * 60_000).toISOString();
    intencoesMock.set(intencao_id, { produto_id: produto.id, produto_nome: produto.nome, quantidade, valor_total, expira_em });

    const tcId = gerarId("tc");
    const resultado = { intencao_id, produto_id: produto.id, quantidade, valor_total, moeda: "BRL", status: "pendente", expira_em };
    return {
      mensagens: [
        {
          role: "assistant",
          content: "",
          tool_calls: [{ id: tcId, nome: "registrar_intencao", argumentos: { produto_id: produto.id, quantidade }, resultado }],
        },
        { role: "tool", content: JSON.stringify(resultado), tool_call_id: tcId },
        {
          role: "assistant",
          content:
            `Registrei sua intenção de compra:\n\n` +
            `🛒 **${produto.nome}** × ${quantidade}\n` +
            `Valor total: **R$ ${valor_total.toFixed(2)}**\n` +
            `ID da intenção: \`${intencao_id}\`\n\n` +
            `Como você quer pagar? **cartão** ou **Pix**?`,
        },
      ],
    };
  }

  if (/(pix|cartão|cartao|pagar|confirmar|finalizar)/i.test(txt)) {
    const metodo: "pix" | "cartao" = /pix/i.test(txt) ? "pix" : "cartao";
    const entradas = [...intencoesMock.entries()];
    const ultima = entradas[entradas.length - 1];

    if (!ultima) {
      return {
        mensagens: [{
          role: "assistant",
          content: "Não há nenhuma intenção de compra pendente. Me diga primeiro qual produto você quer comprar.",
        }],
      };
    }

    const [intencao_id, intencao] = ultima;
    const tcId = gerarId("tc");

    if (intencao.valor_total > saldoMock) {
      const resultado = {
        status: "recusado",
        erro: "LIMITE_EXCEDIDO",
        mensagem: `Saldo insuficiente. Você tem R$ ${saldoMock.toFixed(2)} mas a compra custa R$ ${intencao.valor_total.toFixed(2)}.`,
      };
      return {
        mensagens: [
          {
            role: "assistant",
            content: "",
            tool_calls: [{ id: tcId, nome: "realizar_compra", argumentos: { intencao_id, metodo_pagamento: metodo }, resultado }],
          },
          { role: "tool", content: JSON.stringify(resultado), tool_call_id: tcId },
          {
            role: "assistant",
            content: `❌ Compra recusada: seu limite é R$ ${saldoMock.toFixed(2)}, mas o produto custa R$ ${intencao.valor_total.toFixed(2)}. Deseja escolher outro produto?`,
          },
        ],
      };
    }

    saldoMock -= intencao.valor_total;
    intencoesMock.delete(intencao_id);
    const resultado = {
      status: "aprovado",
      transacao_id: gerarId("tx"),
      intencao_id,
      valor: intencao.valor_total,
      metodo_pagamento: metodo,
      limite_restante: saldoMock,
      data: new Date().toISOString(),
    };
    return {
      mensagens: [
        {
          role: "assistant",
          content: "",
          tool_calls: [{ id: tcId, nome: "realizar_compra", argumentos: { intencao_id, metodo_pagamento: metodo }, resultado }],
        },
        { role: "tool", content: JSON.stringify(resultado), tool_call_id: tcId },
        {
          role: "assistant",
          content:
            `✅ **Compra aprovada!**\n\n` +
            `🛍️ ${intencao.produto_nome} × ${intencao.quantidade}\n` +
            `Método: ${metodo === "pix" ? "Pix" : "Cartão"}\n` +
            `Valor debitado: **R$ ${intencao.valor_total.toFixed(2)}**\n` +
            `Saldo restante: R$ ${saldoMock.toFixed(2)}\n` +
            `Transação: \`${resultado.transacao_id}\`\n\n` +
            `Posso ajudar com mais alguma coisa?`,
        },
      ],
    };
  }

  if (/(int_|intencao_id|ignore|ignora|hack|bypass)/i.test(txt)) {
    const tcId = gerarId("tc");
    const resultado = {
      status: "recusado",
      erro: "INTENCAO_INVALIDA",
      mensagem: "O identificador de intenção não foi criado nesta sessão ou não existe.",
    };
    return {
      mensagens: [
        {
          role: "assistant",
          content: "",
          tool_calls: [{ id: tcId, nome: "realizar_compra", argumentos: { intencao_id: "int_invalido", metodo_pagamento: "pix" }, resultado }],
        },
        { role: "tool", content: JSON.stringify(resultado), tool_call_id: tcId },
        { role: "assistant", content: "❌ Operação bloqueada: a intenção de compra informada é inválida ou não pertence à sua sessão." },
      ],
    };
  }

  return {
    mensagens: [{
      role: "assistant",
      content: "Olá! Posso te ajudar a:\n\n• Ver os **produtos disponíveis** — diga \"o que vocês têm?\"\n• **Comprar** um item — diga \"quero comprar o item 2\"\n• **Pagar** — diga \"pagar no pix\" ou \"pagar no cartão\"\n\nComo posso ajudar?",
    }],
  };
}

let backendIndisponivel = false;

export async function login(corpo: LoginRequest): Promise<LoginResponse> {
  if (backendIndisponivel) {
    const data = loginMock(corpo.username, corpo.senha);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(NOME_KEY, data.usuario.nome);
    return data;
  }
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ erro: "Erro desconhecido" }));
      throw Object.assign(new Error(err.erro ?? "Falha no login"), { status: res.status });
    }
    const data: LoginResponse = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(NOME_KEY, data.usuario.nome);
    return data;
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    if (e.status === 401) throw err;
    if (!e.status || e.status >= 500) {
      backendIndisponivel = true;
      const data = loginMock(corpo.username, corpo.senha);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(NOME_KEY, data.usuario.nome);
      return data;
    }
    throw err;
  }
}

export async function enviarMensagem(mensagem: string): Promise<ChatResponse> {
  if (backendIndisponivel) return chatMock(mensagem);
  const token = lerToken();
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ mensagem }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ erro: "Erro desconhecido" }));
      throw Object.assign(new Error(err.erro ?? "Falha ao enviar mensagem"), { status: res.status });
    }
    return res.json() as Promise<ChatResponse>;
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (!e.status || e.status >= 500) {
      backendIndisponivel = true;
      return chatMock(mensagem);
    }
    throw err;
  }
}
