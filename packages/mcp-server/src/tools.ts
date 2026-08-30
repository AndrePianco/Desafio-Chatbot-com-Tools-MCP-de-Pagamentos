import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { METODOS_PAGAMENTO } from "@desafio/shared";
import type {
  CompraRecusada,
  ErroCompra,
  Intencao,
  MetodoPagamento,
  ResultadoCompra,
} from "@desafio/shared";
import { catalogo, buscarProduto, debitarEstoque } from "./catalog.js";
import { auditar } from "./audit.js";
import {
  buscarIntencao,
  debitar,
  idAleatorio,
  limiteDe,
  salvarIntencao,
  salvarTransacao,
} from "./store.js";

/**
 * Registra as 3 tools MCP no servidor. DONO: Pessoa A.
 *
 * `userId` vem do JWT ja validado no header do transporte. Nenhuma tool
 * recebe user_id como argumento e nenhuma recebe valor -- e isso que
 * impede o modelo de se passar por outro usuario ou de forjar preco.
 */

/**
 * Lido no topo do arquivo -- e por isso que o env.ts precisa ser o
 * PRIMEIRO import do index.ts. Se o .env carregasse depois, este valor
 * cairia silenciosamente no padrao de 300s.
 */
const TTL_SEGUNDOS = Number(process.env.INTENCAO_TTL_SEGUNDOS ?? 300);

/**
 * Embrulha qualquer resposta no formato que o protocolo MCP exige.
 *
 * O MCP nao devolve objetos crus, e sim "blocos de conteudo". Quem le do
 * outro lado e um LLM -- e LLM le texto. Por isso o resultado vira JSON
 * em texto, e por isso as mensagens de erro precisam ser legiveis.
 */
function texto(valor: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(valor) }] };
}

/** Monta uma recusa no formato padrao das 5 do enunciado. */
function recusar(erro: ErroCompra, mensagem: string): CompraRecusada {
  return { status: "recusado", erro, mensagem };
}

export function registrarTools(server: McpServer, userId: string): void {
  /* ================================================================ */
  /* 1. listar_catalogo                                                */
  /* ================================================================ */
  server.registerTool(
    "listar_catalogo",
    {
      title: "Listar catalogo",
      // Esta descricao NAO e comentario: e o texto que o modelo le para
      // decidir se chama esta tool. Descricao ruim = tool errada.
      description:
        "Lista os produtos disponiveis para compra, com id, nome, categoria, descricao, preco em BRL e estoque. Aceita filtro opcional por categoria. Use sempre antes de registrar_intencao, para obter o produto_id correto.",
      inputSchema: {
        categoria: z
          .string()
          .optional()
          .describe(
            "filtro opcional: devolve so produtos dessa categoria. Omita para listar todos.",
          ),
      },
    },
    async (args) => {
      const produtos = args.categoria
        ? catalogo.filter((p) => p.categoria === args.categoria)
        : catalogo;
      const resultado = { produtos };
      auditar({ user_id: userId, tool: "listar_catalogo", args, resultado });
      return texto(resultado);
    },
  );

  /* ================================================================ */
  /* 2. registrar_intencao                                             */
  /* ================================================================ */
  server.registerTool(
    "registrar_intencao",
    {
      title: "Registrar intencao de compra",
      description:
        "Registra a intencao de comprar um produto do catalogo. O servidor calcula o valor_total e devolve um intencao_id com prazo para pagamento. Use antes de realizar_compra. Nao informe preco nem valor: eles vem do catalogo.",
      inputSchema: {
        produto_id: z
          .string()
          .describe("id do produto, exatamente como veio de listar_catalogo"),
        quantidade: z
          .number()
          .int()
          .positive()
          .describe("quantidade de unidades, numero inteiro maior que zero"),
      },
    },
    async (args) => {
      const produto = buscarProduto(args.produto_id);

      // Produto inexistente: a defesa contra o modelo inventar um id.
      if (!produto) {
        const resultado = {
          erro: "PRODUTO_INVALIDO",
          mensagem: `O produto ${args.produto_id} nao existe no catalogo. Use listar_catalogo para ver os ids validos.`,
        };
        auditar({
          user_id: userId,
          tool: "registrar_intencao",
          args,
          resultado,
        });
        return texto(resultado);
      }

      if (produto.estoque < args.quantidade) {
        const resultado = {
          erro: "ESTOQUE_INSUFICIENTE",
          mensagem: `${produto.nome} tem apenas ${produto.estoque} unidade(s) em estoque, e foram pedidas ${args.quantidade}.`,
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
        user_id: userId, // do JWT, NUNCA de argumento
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: args.quantidade,
        // Calculado aqui: o modelo nao tem por onde injetar um valor.
        // toFixed(2) evita as sobras de ponto flutuante (0.1+0.2).
        valor_total: Number((produto.preco * args.quantidade).toFixed(2)),
        moeda: produto.moeda,
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

  /* ================================================================ */
  /* 3. realizar_compra                                                */
  /* ================================================================ */
  server.registerTool(
    "realizar_compra",
    {
      title: "Realizar compra",
      description:
        "Paga uma intencao previamente registrada, usando o intencao_id devolvido por registrar_intencao. Metodos aceitos: cartao ou pix. Devolve aprovado com transacao_id, ou recusado com o motivo.",
      inputSchema: {
        intencao_id: z
          .string()
          .describe("id devolvido por registrar_intencao, no formato int_xxxxxx"),
        // String livre de proposito: se fosse z.enum, o zod barraria o
        // metodo invalido antes do nosso codigo rodar, e o enunciado
        // exige que NOS respondamos METODO_INVALIDO.
        metodo_pagamento: z
          .string()
          .describe("forma de pagamento: cartao ou pix"),
      },
    },
    async (args) => {
      const intencao = buscarIntencao(args.intencao_id);
      let resultado: ResultadoCompra;

      // A ORDEM abaixo e obrigatoria: o checklist testa casos onde dois
      // erros valem ao mesmo tempo, e o primeiro da fila deve vencer.

      // 1. Nao existe OU nao e deste usuario.
      //    As duas condicoes dao a MESMA resposta de proposito: dizer
      //    "essa intencao e de outra pessoa" ja vazaria que ela existe.
      if (!intencao || intencao.user_id !== userId) {
        resultado = recusar(
          "INTENCAO_INVALIDA",
          `A intencao ${args.intencao_id} nao existe ou nao pertence a este usuario.`,
        );
      }
      // 2. Ja foi paga.
      else if (intencao.status === "pago") {
        resultado = recusar(
          "INTENCAO_JA_PAGA",
          `A intencao ${intencao.intencao_id} ja foi paga e nao pode ser cobrada de novo.`,
        );
      }
      // 3. Passou do prazo.
      else if (Date.now() > new Date(intencao.expira_em).getTime()) {
        resultado = recusar(
          "INTENCAO_EXPIRADA",
          `A intencao ${intencao.intencao_id} expirou em ${intencao.expira_em}. Registre uma nova intencao.`,
        );
      }
      // 4. Metodo de pagamento fora dos aceitos.
      else if (
        !METODOS_PAGAMENTO.includes(args.metodo_pagamento as MetodoPagamento)
      ) {
        resultado = recusar(
          "METODO_INVALIDO",
          `Metodo "${args.metodo_pagamento}" nao e aceito. Use cartao ou pix.`,
        );
      }
      // 5. Estoura o limite restante.
      //    Precisa vir ANTES de debitar: o store nao tem trava nenhuma.
      else if (intencao.valor_total > limiteDe(userId)) {
        resultado = recusar(
          "LIMITE_EXCEDIDO",
          `O valor de R$ ${intencao.valor_total.toFixed(2)} ultrapassa o limite disponivel de R$ ${limiteDe(userId).toFixed(2)}.`,
        );
      }
      // 6. Passou pelas cinco: cobra.
      else {
        const metodo = args.metodo_pagamento as MetodoPagamento;
        const limiteRestante = debitar(userId, intencao.valor_total);
        debitarEstoque(intencao.produto_id, intencao.quantidade);

        intencao.status = "pago";
        salvarIntencao(intencao);

        const transacaoId = idAleatorio("tx");
        const agora = new Date().toISOString();
        salvarTransacao({
          transacao_id: transacaoId,
          intencao_id: intencao.intencao_id,
          user_id: userId,
          valor: intencao.valor_total,
          metodo_pagamento: metodo,
          criada_em: agora,
        });

        resultado = {
          status: "aprovado",
          transacao_id: transacaoId,
          intencao_id: intencao.intencao_id,
          produto_nome: intencao.produto_nome,
          quantidade: intencao.quantidade,
          valor_debitado: intencao.valor_total,
          metodo_pagamento: metodo,
          limite_restante: limiteRestante,
          criada_em: agora, // ISO 8601 -- exigido pelo enunciado oficial
        };
      }

      auditar({ user_id: userId, tool: "realizar_compra", args, resultado });
      return texto(resultado);
    },
  );
}
