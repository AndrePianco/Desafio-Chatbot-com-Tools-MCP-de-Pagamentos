import { useState } from "react";
import Login from "./Login.js";
import Chat  from "./Chat.js";
import { lerToken, lerNome, encerrarSessao } from "./api.js";

export default function App() {
  const [usuario, setUsuario] = useState<{ id: string; nome: string } | null>(() => {
    const token = lerToken();
    const nome  = lerNome();
    return token && nome ? { id: "", nome } : null;
  });

  function aoSair() {
    encerrarSessao();
    setUsuario(null);
  }

  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      <div className="app-root">
        {usuario
          ? <Chat nome={usuario.nome} aoSair={aoSair} />
          : <Login aoEntrar={setUsuario} />
        }
      </div>
    </>
  );
}
