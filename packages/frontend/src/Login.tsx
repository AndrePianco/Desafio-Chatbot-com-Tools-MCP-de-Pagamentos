import { useState, type FormEvent } from "react";
import { login } from "./api.js";

interface Props {
  aoEntrar: (usuario: { id: string; nome: string }) => void;
}

export default function Login({ aoEntrar }: Props) {
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const dados = await login({ username, senha });
      aoEntrar(dados.usuario);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="tela-centro">
      <form className="cartao" onSubmit={enviar}>
        <h1>Chatbot de Pagamentos</h1>
        <p className="sub">Entre para conversar com o assistente.</p>
        <label>
          Usuario
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button disabled={carregando || !username || !senha}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
