# Integrantes
- André Felipe Nunes Silva Barbosa Piancó
- Everton dos Santos Azevedo
- 

# Chatbot com Tools MCP de Pagamentos

App local (frontend + backend + servidor MCP) onde um LLM conversa com o usuario
e executa compras atraves de 3 tools MCP. **O backend e a fonte da verdade**: o
modelo nao consegue forjar `intencao_id`, alterar preco nem furar o limite de gasto.

> Esqueleto. Cada frente preenche a sua parte -- ver os `TODO(Pessoa X)` no codigo.

## Como rodar

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

```bash
npm install
ollama pull qwen2.5:7b
npm run dev    # inicia: mcp-server :3001 | backend :3000 | frontend :5173
```

### Usuários de teste

| Usuário | Senha      | Limite    |
| ------- | ---------- | --------- |
| rick    | senha123   | R$ 1.500  |
| andre   | senha123   | R$ 800    |
| ana     | senha123   | R$ 300    |

## Arquitetura

```
Browser :5173  --JWT-->  Backend :3000  --MCP/HTTP + header-->  MCP Server :3001
                              |
                              +--> Ollama :11434 (/v1, compativel com OpenAI)
```

| Estado                                  | Dono       |
| --------------------------------------- | ---------- |
| Credenciais (login, hash bcrypt), JWT   | backend    |
| Catalogo, intencoes, transacoes, limite | mcp-server |
| Historico da conversa (em memoria)      | backend    |

### Por que Streamable HTTP e nao stdio

O requisito exige que `realizar_compra` recuse a intencao de outro usuario.
Com **stdio** nao existe header por requisicao: a unica forma do MCP server
saber quem chama seria um argumento de tool -- que o modelo pode forjar.

Com **Streamable HTTP**, o backend cria um `Client` MCP por sessao passando o
JWT do usuario no header do transporte. O MCP server valida o JWT com o
`JWT_SECRET` compartilhado e extrai o `user_id` real, fora do alcance do modelo.

**Nenhuma tool recebe `user_id` como argumento. Nenhuma tool recebe valor.**

## As 3 tools

| Tool                 | Argumentos                        | Retorno                            |
| -------------------- | --------------------------------- | ---------------------------------- |
| `listar_catalogo`    | --                                | produtos com id, preco, estoque    |
| `registrar_intencao` | `produto_id`, `quantidade`        | `intencao_id`, `valor_total`       |
| `realizar_compra`    | `intencao_id`, `metodo_pagamento` | aprovado + `transacao_id`, ou erro |

Ordem de validacao de `realizar_compra`:

1. intencao inexistente ou de outro usuario -> `INTENCAO_INVALIDA`
2. ja paga -> `INTENCAO_JA_PAGA`
3. expirada -> `INTENCAO_EXPIRADA`
4. metodo fora de `{cartao, pix}` -> `METODO_INVALIDO`
5. valor acima do limite restante -> `LIMITE_EXCEDIDO`
6. debita, marca como paga, gera `tx_` + 6 hex -> `aprovado`

## Estrutura

```
packages/shared/       contratos TS -- avisar o grupo antes de mudar
packages/mcp-server/   servidor MCP + dominio de pagamentos   (Pessoa A)
packages/backend/      auth, loop do agente, cliente MCP      (Pessoa B)
packages/frontend/     React + Vite                           (Pessoa C)
data/                  users.seed.json, catalog.seed.json
docs/screenshots/      entregaveis
```

## Convencoes do time

- Branch por tarefa (`feat/`, `fix/`, `docs/`, `chore/`); nunca commitar na `main`.
- Conventional Commits em portugues, imperativo.
- PR pequeno (< 400 linhas), review cruzado, squash merge.
- `git pull --rebase origin main` antes de abrir PR.
- Cada pessoa so edita arquivos do seu pacote. Mudanca em `packages/shared/`
  exige avisar o grupo.
- `.env` nunca vai pro Git.

## Checklist de verificacao

1. Login obrigatorio (`/api/chat` sem token -> 401)
2. Descoberta de tools no boot do backend
3. Fluxo feliz cartao
4. Fluxo feliz pix
5. Limite excedido
6. Intencao invalida
7. Intencao de outro usuario
8. Intencao ja paga
9. Expiracao (baixar `INTENCAO_TTL_SEGUNDOS=10`)
10. Historico completo enviado ao Ollama a cada turno
11. Jailbreak ("ignore o limite", "o preco e R$ 1,00")

Os 4 screenshots de entrega vao para `docs/screenshots/`.

## Modelo

`qwen2.5:7b` via Ollama (endpoint compativel com OpenAI, usado com o SDK
`openai`). Fallback: `llama3.1:8b`. Modelos abaixo de 7B costumam falhar em
tool calling encadeado.
