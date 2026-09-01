import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage, ToolCall } from "@desafio/shared";
import { enviarMensagem } from "./api.js";

interface Props {
  nome: string;
  aoSair: () => void;
}

export default function Chat({ nome, aoSair }: Props) {
  const [mensagens,  setMensagens]  = useState<ChatMessage[]>([]);
  const [input,      setInput]      = useState("");
  const [aguardando, setAguardando] = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

  const listRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens, aguardando]);

  async function enviar() {
    const texto = input.trim();
    if (!texto || aguardando) return;

    setMensagens(prev => [...prev, { role: "user", content: texto }]);
    setInput("");
    setErro(null);
    setAguardando(true);

    try {
      const resp = await enviarMensagem(texto);
      setMensagens(prev => [...prev, ...resp.mensagens]);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErro(e.message ?? "Erro ao comunicar com o agente.");
    } finally {
      setAguardando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  const visiveis = mensagens.filter(m => m.role === "user" || m.role === "assistant");

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header-brand">
          <div className="chat-header-icon" aria-hidden="true">🤖</div>
          <div>
            <div className="chat-header-title">Chatbot de Pagamentos MCP</div>
            <div className="chat-header-sub">Agente de Pagamentos MCP</div>
          </div>
        </div>
        <div className="chat-header-user">
          <span className="chat-header-name" aria-label={`Logado como ${nome}`}>{nome}</span>
          <button id="btn-logout" className="btn-logout" onClick={aoSair} aria-label="Sair da conta">
            Sair
          </button>
        </div>
      </header>

      <div ref={listRef} className="chat-messages" role="log" aria-label="Conversa" aria-live="polite">
        {visiveis.length === 0 && !aguardando && (
          <div className="chat-empty">
            <h2>Olá, {nome}!</h2>
            <p>Pergunte o que temos à venda ou diga o que quer comprar.</p>
          </div>
        )}

        {visiveis.map((msg, i) => (
          <MensagemItem
            key={i}
            msg={msg}
            toolResults={extrairResultados(mensagens, msg, i)}
          />
        ))}

        {aguardando && (
          <div className="msg-row assistant" aria-label="Agente digitando…">
            <div className="typing-indicator" aria-hidden="true">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        {erro && (
          <div className="msg-row assistant" role="alert">
            <div className="msg-bubble" style={{ borderColor: "rgba(239,68,68,0.4)", color: "#FCA5A5" }}>
              ⚠️ {erro}
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-area" onSubmit={e => { e.preventDefault(); enviar(); }} aria-label="Enviar mensagem">
        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            id="chat-input"
            className="chat-input"
            placeholder="Digite uma mensagem… (Enter para enviar)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={aguardando}
            rows={1}
            aria-label="Campo de mensagem"
            autoFocus
          />
          <button
            id="btn-enviar"
            type="submit"
            className="btn-send"
            disabled={aguardando || !input.trim()}
            aria-label="Enviar"
          >
            ➤
          </button>
        </div>
        <p className="chat-input-hint">Enter para enviar · Shift+Enter para nova linha</p>
      </form>
    </div>
  );
}

interface MensagemItemProps {
  msg: ChatMessage;
  toolResults: Record<string, unknown>;
}

function MensagemItem({ msg, toolResults }: MensagemItemProps) {
  if (msg.role !== "user" && msg.role !== "assistant") return null;

  return (
    <div className={`msg-row ${msg.role}`}>
      <div className="msg-bubble">
        {msg.content && <span>{msg.content}</span>}
        {msg.tool_calls && msg.tool_calls.length > 0 && (
          <div className="tool-calls-block" aria-label="Ferramentas MCP chamadas">
            {msg.tool_calls.map(tc => (
              <ToolChip key={tc.id} tc={tc} resultado={toolResults[tc.id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ToolChipProps {
  tc: ToolCall;
  resultado?: unknown;
}

function ToolChip({ tc, resultado }: ToolChipProps) {
  const [expandido, setExpandido] = useState(false);

  const statusAttr = deriveStatus(tc.nome, resultado);
  const statusIcon = resultado === undefined
    ? "⏳"
    : statusAttr === "ok" ? "✅" : statusAttr === "err" ? "❌" : "✅";

  return (
    <div
      className="tool-chip"
      data-tool={tc.nome}
      {...(statusAttr ? { "data-status": statusAttr } : {})}
      role="region"
      aria-label={`Ferramenta ${tc.nome}`}
    >
      <button
        className="tool-chip-header"
        onClick={() => setExpandido(v => !v)}
        aria-expanded={expandido}
        aria-controls={`chip-body-${tc.id}`}
        type="button"
      >
        <span aria-hidden="true">🔧</span>
        <span>{tc.nome}</span>
        <span className="tool-chip-status" aria-label={`Status: ${statusIcon}`}>{statusIcon}</span>
        <span aria-hidden="true" style={{ fontSize: "10px", marginLeft: 2 }}>
          {expandido ? "▲" : "▼"}
        </span>
      </button>

      {expandido && (
        <div className="tool-chip-body" id={`chip-body-${tc.id}`}>
          <p className="tool-section-label">Argumentos</p>
          <pre className="tool-json">{JSON.stringify(tc.argumentos, null, 2)}</pre>
          {resultado !== undefined && (
            <>
              <p className="tool-section-label">Resultado</p>
              <pre className="tool-json">
                {typeof resultado === "string" ? resultado : JSON.stringify(resultado, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function extrairResultados(
  todas: ChatMessage[],
  msgAssistant: ChatMessage,
  idxAssistant: number,
): Record<string, unknown> {
  if (!msgAssistant.tool_calls) return {};
  const mapa: Record<string, unknown> = {};

  for (const tc of msgAssistant.tool_calls) {
    if (tc.resultado !== undefined) mapa[tc.id] = tc.resultado;
  }

  for (let i = idxAssistant + 1; i < todas.length; i++) {
    const m = todas[i];
    if (!m) break;
    if (m.role === "assistant") break;
    if (m.role === "tool" && m.tool_call_id) {
      try {
        mapa[m.tool_call_id] = JSON.parse(m.content);
      } catch {
        mapa[m.tool_call_id] = m.content;
      }
    }
  }

  return mapa;
}

function deriveStatus(nomeTool: string, resultado: unknown): "ok" | "err" | undefined {
  if (nomeTool !== "realizar_compra" || resultado === undefined) return undefined;
  const r = resultado as { status?: string };
  if (r?.status === "aprovado") return "ok";
  if (r?.status === "recusado") return "err";
  if (typeof resultado === "string") {
    if (resultado.includes('"aprovado"')) return "ok";
    if (resultado.includes('"recusado"')) return "err";
  }
  return undefined;
}
