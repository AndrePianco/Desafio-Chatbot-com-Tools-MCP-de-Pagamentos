import { config } from "dotenv";
import { fileURLToPath } from "node:url";

/**
 * Carrega o .env da RAIZ do projeto.
 * Importado como primeiro import do index.ts para garantir que roda antes de tudo.
 */
config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
