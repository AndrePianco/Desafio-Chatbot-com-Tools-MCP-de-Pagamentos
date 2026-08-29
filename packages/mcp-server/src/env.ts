import { config } from "dotenv";
import { fileURLToPath } from "node:url";

/**
 * Carrega o .env da RAIZ do projeto. DONO: Pessoa A.
 *
 * Por que um arquivo separado, e nao uma chamada dentro do index.ts:
 * em ESM todos os `import` rodam ANTES da primeira linha do corpo do
 * modulo. O tools.ts le INTENCAO_TTL_SEGUNDOS no topo do arquivo, entao
 * carregar o .env no corpo do index.ts seria tarde demais -- o TTL
 * cairia silenciosamente no padrao de 300s e o teste de expiracao
 * (item 9 do checklist) falharia sem dar pista nenhuma.
 *
 * Importando este arquivo como PRIMEIRO import do index.ts, ele roda
 * antes de todos os outros.
 *
 * O caminho e ancorado neste arquivo (nao no diretorio de onde o
 * processo foi iniciado), porque o `npm run dev -w <pacote>` inicia cada
 * pacote dentro da pasta dele -- e o .env mora na raiz.
 */
config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
