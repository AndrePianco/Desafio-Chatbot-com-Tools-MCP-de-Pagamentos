/**
 * Audit log -- uma linha por chamada de tool. DONO: Pessoa A.
 *
 * Extra do desafio, barato: vira evidencia nos screenshots de entrega.
 *
 * TODO(Pessoa A): acrescentar {ts, user_id, tool, args, resultado} em
 * audit.log. Falha de escrita nao pode derrubar a compra.
 */
export function auditar(entrada: {
  user_id: string;
  tool: string;
  args: unknown;
  resultado: unknown;
}): void {
  throw new Error("TODO(Pessoa A): auditar");
}
