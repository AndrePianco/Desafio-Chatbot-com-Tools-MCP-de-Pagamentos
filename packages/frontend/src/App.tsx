import { useState } from "react";
import Login from "./Login.js";
import Chat from "./Chat.js";
import { encerrarSessao, lerNome, lerToken } from "./api.js";

export default function App() {
  // Guard de rota simples: sem token, so existe a tela de login.
  const [autenticado, setAutenticado] = useState(() => Boolean(lerToken()));
  const [nome, setNome] = useState(lerNome);

  if (!autenticado) {
    return (
      <Login
        aoEntrar={(usuario) => {
          setNome(usuario.nome);
          setAutenticado(true);
        }}
      />
    );
  }

  return (
    <Chat
      nome={nome}
      aoSair={() => {
        encerrarSessao();
        setAutenticado(false);
      }}
    />
  );
}
