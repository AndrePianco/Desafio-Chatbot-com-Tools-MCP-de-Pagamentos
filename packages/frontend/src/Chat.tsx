import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "@desafio/shared";
import { enviarMensagem } from "./api.js";

interface Props {
  nome: string;
  aoSair: () => void;
}

/**
 * Renderiza a tool call como um chip. Nao e enfeite: e o que faz os
 * screenshots de entrega provarem que as tools rodaram de verdade.
 */
function ChipTool({ nome, args }: { nome: string; args: unknown }) {
  const resumo = Object.entries((args ?? {}) as Record<string, unknown>)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(" ");
  return (
    <span className="chip">
      <code>{nome}</code>
      {resumo && <span className="chip-args">{resumo}</span>}
    </span>
  );
}

function Bolha({ msg }: { msg: ChatMessage }) {
  if (msg.role === "tool") {
    return (
      <div className="linha tool">
        <pre className="resultado-tool">{msg.content}</pre>
      </div>
    );
  }
  return (
    <div className={`linha ${msg.role}`}>
      <div className="bolha">
        {msg.tool_calls?.length ? (
          <div className="chips">
            {msg.tool_calls.map((t) => (
              <ChipTool key={t.id} nome={t.nome} args={t.argumentos} />
            ))}
          </div>
        ) : null}
        {msg.content && <p>{msg.content}</p>}
      </div>
    </div>
  );
}

export default function Chat({ nome, aoSair }: Props) {
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;

    setMensagens((m) => [...m, { role: "user", content: mensagem }]);
    setTexto("");
    setEnviando(true);
    try {
      const { mensagens: novas } = await enviarMensagem(mensagem);
      setMensagens((m) => [...m, ...novas]);
    } catch (err) {
      setMensagens((m) => [
        ...m,
        { role: "assistant", content: `Erro: ${(err as Error).message}` },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="chat">
      <header>
        <strong>Assistente de Compras</strong>
        <span className="sub">{nome}</span>
        <button className="link" onClick={aoSair}>
          Sair
        </button>
      </header>

      <main>
        {mensagens.length === 0 && (
          <p className="vazio">Pergunte algo como: o que tem a venda?</p>
        )}
        {mensagens.map((m, i) => (
          <Bolha key={i} msg={m} />
        ))}
        {enviando && (
          <div className="linha assistant">
            <div className="bolha pensando">...</div>
          </div>
        )}
        <div ref={fim} />
      </main>

      <form onSubmit={enviar}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua mensagem..."
          autoFocus
        />
        <button disabled={enviando || !texto.trim()}>Enviar</button>
      </form>
    </div>
  );
}
