interface Props {
  aoEntrar: (usuario: { id: string; nome: string }) => void;
}

/**
 * Tela de login. DONO: Pessoa C.
 *
 * TODO(Pessoa C): formulario de usuario e senha, POST /api/login, guardar
 * o token e chamar aoEntrar. Mostrar a mensagem de erro quando o backend
 * responder 401.
 */
export default function Login({ aoEntrar }: Props) {
  return <p>TODO(Pessoa C): Login -- formulario de usuario e senha.</p>;
}
