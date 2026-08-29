import { FormEvent, useState } from "react";
import { login } from "./api.js";

interface Props {
  aoEntrar: (usuario: { id: string; nome: string }) => void;
}

export default function Login({ aoEntrar }: Props) {
  const [username, setUsername] = useState("");
  const [senha,    setSenha]    = useState("");
  const [erro,     setErro]     = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setErro(null);
    setCarregando(true);
    try {
      const dados = await login({ username: username.trim(), senha });
      aoEntrar(dados.usuario);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 401) {
        setErro("Usuário ou senha inválidos. Tente novamente.");
      } else {
        setErro(e.message ?? "Erro ao conectar com o servidor.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <main className="login-card" role="main">
        <div className="login-logo">
          <div className="login-logo-icon" aria-hidden="true">🤖</div>
          <span className="login-logo-text">Chatbot de Pagamentos MCP</span>
        </div>
        <p className="login-subtitle">Agente de compras via linguagem natural</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-username">Usuário</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="ex: rick"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={carregando}
            />
          </div>

          <div className="field">
            <label htmlFor="login-senha">Senha</label>
            <input
              id="login-senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              disabled={carregando}
            />
          </div>

          {erro && (
            <div className="login-error" role="alert" aria-live="assertive">
              <span aria-hidden="true">⚠️</span>
              {erro}
            </div>
          )}

          <button
            id="btn-entrar"
            type="submit"
            className="btn-primary"
            disabled={carregando || !username.trim() || !senha}
          >
            {carregando
              ? <><div className="spinner" aria-hidden="true" /> Entrando…</>
              : "Entrar →"
            }
          </button>
        </form>

        <div className="login-hint" aria-label="Contas de teste disponíveis">
          <p className="login-hint-title">Contas de teste</p>
          {[
            { user: "rick",  senha: "rick123",  limite: "R$ 1.500" },
            { user: "andre", senha: "andre123", limite: "R$ 800" },
            { user: "ana",   senha: "ana123",   limite: "R$ 300" },
          ].map(u => (
            <div className="login-hint-row" key={u.user}>
              <span>
                <code>{u.user}</code> / <code>{u.senha}</code>
              </span>
              <span className="login-hint-badge">Limite {u.limite}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
