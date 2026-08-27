import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  CompraRecusada,
  Intencao,
  MetodoPagamento,
  ResultadoCompra,
} from "@desafio/shared";
import { catalogo, buscarProduto } from "./catalog.js";
import { auditar } from "./audit.js";
import {
  buscarIntencao,
  debitar,
  idAleatorio,
  limiteDe,
  salvarIntencao,
  salvarTransacao,
} from "./store.js";

const TTL_SEGUNDOS = Number(process.env.INTENCAO_TTL_SEGUNDOS ?? 300);

function texto(valor: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(valor) }] };
}

function recusar(
  erro: CompraRecusada["erro"],
  mensagem: string,
): CompraRecusada {
  return { status: "recusado", erro, mensagem };
}

/**
 * Registra as 3 tools no servidor MCP.
 *
 * `userId` vem do JWT validado no header do transporte -- nenhuma tool
 * recebe user_id como argumento, entao o modelo nao consegue se passar
 * por outro usuario. Nenhuma tool recebe valor: preco vem do catalogo.
 */
export function registrarTools(server: McpServer, userId: string): void {
  /* ---------------------------------------------------------------- */
  server.registerTool(
    "listar_catalogo",
    {
      title: "Listar catalogo",
      description:
        "Lista os produtos disponiveis para compra, com id, nome, descricao, preco em BRL e estoque.",
      inputSchema: {},
    },
    async () => {
      const resultado = { produtos: catalogo };
      auditar({ user_id: userId, tool: "listar_catalogo", args: {}, resultado });
      return texto(resultado);
    },
  );

  /* ---------------------------------------------------------------- */
  server.registerTool(
    "registrar_intencao",
    {
      title: "Registrar intencao de compra",
      description:
        "Registra a intencao de comprar um produto do catalogo. Retorna intencao_id e valor_total calculados pelo servidor. Use antes de realizar_compra.",
      inputSchema: {
        produto_id: z.string().describe("id do produto vindo de listar_catalogo"),
        quantidade: z.number().int().positive().describe("quantidade de unidades"),
      },
    },
    async (args) => {
      // TODO(Pessoa A): validar estoque disponivel antes de aceitar.
      const produto = buscarProduto(args.produto_id);
      if (!produto) {
        const resultado = {
          erro: "PRODUTO_INVALIDO",
          mensagem: `Produto ${args.produto_id} nao existe no catalogo.`,
        };
        auditar({
          user_id: userId,
          tool: "registrar_intencao",
          args,
          resultado,
        });
        return texto(resultado);
      }

      const agora = new Date();
      const intencao: Intencao = {
        intencao_id: idAleatorio("int"),
        user_id: userId, // do JWT, nunca do argumento
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: args.quantidade,
        valor_total: Number((produto.preco * args.quantidade).toFixed(2)),
        status: "pendente",
        criada_em: agora.toISOString(),
        expira_em: new Date(
          agora.getTime() + TTL_SEGUNDOS * 1000,
        ).toISOString(),
      };
      salvarIntencao(intencao);

      auditar({
        user_id: userId,
        tool: "registrar_intencao",
        args,
        resultado: intencao,
      });
      return texto(intencao);
    },
  );

  /* ---------------------------------------------------------------- */
  server.registerTool(
    "realizar_compra",
    {
      title: "Realizar compra",
      description:
        "Paga uma intencao previamente registrada. Retorna aprovado com transacao_id, ou recusado com o motivo.",
      inputSchema: {
        intencao_id: z
          .string()
          .describe("id retornado por registrar_intencao"),
        metodo_pagamento: z
          .enum(["cartao", "pix"])
          .describe("forma de pagamento"),
      },
    },
    async (args) => {
      // ================================================================
      // TODO(Pessoa A): esta e a sequencia de validacao do enunciado.
      // A ORDEM importa -- os testes do checklist dependem dela:
      //   1. intencao inexistente OU intencao.user_id !== userId
      //                                          -> INTENCAO_INVALIDA
      //   2. status === "pago"                   -> INTENCAO_JA_PAGA
      //   3. now > expira_em                     -> INTENCAO_EXPIRADA
      //   4. metodo fora de {cartao, pix}        -> METODO_INVALIDO
      //   5. valor_total > limite_restante       -> LIMITE_EXCEDIDO
      //   6. debitar, marcar como paga, gerar tx_ -> aprovado
      // Abaixo esta so o passo 1 + caminho feliz, para o scaffold
      // responder no formato certo. Os passos 2-5 sao seus.
      // ================================================================
      const intencao = buscarIntencao(args.intencao_id);

      let resultado: ResultadoCompra;
      if (!intencao || intencao.user_id !== userId) {
        resultado = recusar(
          "INTENCAO_INVALIDA",
          `A intencao ${args.intencao_id} nao existe ou nao pertence a este usuario.`,
        );
      } else {
        const restante = debitar(intencao.user_id, intencao.valor_total);
        intencao.status = "pago";
        salvarIntencao(intencao);
        const transacaoId = idAleatorio("tx");
        salvarTransacao({
          transacao_id: transacaoId,
          intencao_id: intencao.intencao_id,
          user_id: intencao.user_id,
          valor: intencao.valor_total,
          metodo_pagamento: args.metodo_pagamento as MetodoPagamento,
          criada_em: new Date().toISOString(),
        });
        resultado = {
          status: "aprovado",
          transacao_id: transacaoId,
          intencao_id: intencao.intencao_id,
          produto_nome: intencao.produto_nome,
          quantidade: intencao.quantidade,
          valor_debitado: intencao.valor_total,
          metodo_pagamento: args.metodo_pagamento as MetodoPagamento,
          limite_restante: restante,
        };
      }

      auditar({ user_id: userId, tool: "realizar_compra", args, resultado });
      return texto(resultado);
    },
  );

  void limiteDe; // usado pela Pessoa A no passo 5
}
