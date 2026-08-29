import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registra as 3 tools MCP no servidor. DONO: Pessoa A.
 *
 * `userId` vem do JWT ja validado no header do transporte. Nenhuma tool
 * recebe user_id como argumento e nenhuma recebe valor -- e isso que
 * impede o modelo de se passar por outro usuario ou de forjar preco.
 *
 * TODO(Pessoa A) -- as 3 tools, com schemas Zod:
 *
 *   listar_catalogo     sem argumentos
 *                       -> produtos com id, nome, descricao, preco, estoque
 *
 *   registrar_intencao  produto_id, quantidade (inteiro > 0)
 *                       valida produto existente e estoque disponivel
 *                       valor_total = preco * quantidade, calculado aqui
 *                       gera intencao_id, status "pendente", expira_em
 *                       -> intencao_id, valor_total
 *
 *   realizar_compra     intencao_id, metodo_pagamento
 *                       ORDEM OBRIGATORIA de validacao (o checklist do
 *                       desafio testa casos onde dois erros valem ao
 *                       mesmo tempo, entao a ordem importa):
 *                         1. nao existe OU nao e do usuario do JWT
 *                                                  -> INTENCAO_INVALIDA
 *                         2. status ja e "pago"    -> INTENCAO_JA_PAGA
 *                         3. passou de expira_em   -> INTENCAO_EXPIRADA
 *                         4. metodo fora de {cartao, pix}
 *                                                  -> METODO_INVALIDO
 *                         5. valor_total acima do limite restante
 *                                                  -> LIMITE_EXCEDIDO
 *                         6. debita, marca paga, gera tx_ -> aprovado
 *
 *   Todo retorno de erro traz mensagem legivel -- e o texto que o agente
 *   usa para explicar ao usuario. Toda chamada de tool chama auditar().
 */
export function registrarTools(server: McpServer, userId: string): void {
  throw new Error("TODO(Pessoa A): registrarTools");
}
