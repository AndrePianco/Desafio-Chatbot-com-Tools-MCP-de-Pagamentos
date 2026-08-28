interface Props {
  nome: string;
  aoSair: () => void;
}

/**
 * Tela de chat. DONO: Pessoa C.
 *
 * TODO(Pessoa C):
 *   - lista de mensagens + campo de envio, chamando enviarMensagem()
 *   - renderizar as tool calls visualmente (ex.: chip cinza
 *     "registrar_intencao int_a1b2c3"). Isso nao e enfeite: e o que faz
 *     os screenshots de entrega provarem que as tools rodaram de verdade.
 *   - botao de sair, limpando o token
 */
export default function Chat({ nome, aoSair }: Props) {
  return <p>TODO(Pessoa C): Chat -- mensagens, envio e chips de tool call.</p>;
}
