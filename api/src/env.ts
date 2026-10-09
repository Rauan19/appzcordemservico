import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("365d"),
  /** Origens do painel web, separadas por vírgula. Ex.: http://localhost:5555,*.zcnetprovedor.com.br */
  CORS_ORIGINS: z.string().optional(),
  /** Pasta base para uploads locais (fotos de contrato, assinaturas) */
  UPLOAD_DIR: z.string().default("./uploads"),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().positive().default(10),
  /** URL pública do painel web (para gerar link de assinatura) */
  PUBLIC_WEB_URL: z.string().optional(),
  /** Evolution API (WhatsApp). A chave fica só na API; o painel nunca a recebe. */
  EVOLUTION_URL: z.string().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  /** URL do bot que recebe os eventos das instâncias (roda fora deste projeto) */
  EVOLUTION_WEBHOOK_URL: z.string().optional(),
  /** Prefixo das instâncias deste painel (ex.: zc_). Só as que começam com ele são listadas, criadas e contadas. */
  EVOLUTION_INSTANCE_PREFIX: z.string().default(""),
  /** Vários bots: "prefixo=urlDoWebhook,prefixo2=urlDoWebhook2". Tem prioridade sobre EVOLUTION_INSTANCE_PREFIX/WEBHOOK_URL. */
  EVOLUTION_BOTS: z.string().optional(),
  WHATSAPP_MAX_INSTANCES: z.coerce.number().int().positive().default(5),
});

function parseCorsOrigins(raw?: string) {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function hostnameFromOrigin(origin: string) {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

export function isCorsOriginAllowed(origin: string | undefined, patterns: string[]) {
  if (!origin) return true;
  if (patterns.length === 0) return true;

  for (const pattern of patterns) {
    if (pattern === "*") return true;
    if (pattern === origin) return true;

    if (pattern.startsWith("*.")) {
      const root = pattern.slice(2);
      const hostname = hostnameFromOrigin(origin);
      if (hostname && (hostname === root || hostname.endsWith(`.${root}`))) {
        return true;
      }
    }
  }

  return false;
}

export const env = {
  ...EnvSchema.parse(process.env),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
};

