/**
 * Environment loader — MUST be imported first in index.ts
 *
 * Loads .env from repo root with override=true so that real values
 * replace any literal ${VAR} strings passed by Claude Code.
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env"), override: true });
