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

