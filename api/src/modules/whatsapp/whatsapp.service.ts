import { env } from "../../env.js";
import { BadRequestError, ConflictError, HttpError, NotFoundError } from "../../http/http-errors.ts";

export type WhatsappStatus = "open" | "connecting" | "close";

export type WhatsappInstance = {
  name: string;
  status: WhatsappStatus;
  number: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
  /** Bot que atende a instância (rótulo do prefixo) */
  bot?: string;
};

export type WhatsappQr = {
  base64: string | null;
  pairingCode: string | null;
};

const WEBHOOK_EVENTS = ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"];

function config() {
  if (!env.EVOLUTION_URL || !env.EVOLUTION_API_KEY) {
    throw new HttpError(503, "EVOLUTION_NOT_CONFIGURED", "Evolution API não configurada (EVOLUTION_URL / EVOLUTION_API_KEY).");
  }
  return { url: env.EVOLUTION_URL.replace(/\/+$/, ""), key: env.EVOLUTION_API_KEY };
}

async function evo<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { url, key } = config();
  let res: Response;
  try {
    res = await fetch(`${url}${path}`, {
      method,
      headers: { apikey: key, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new HttpError(502, "EVOLUTION_UNREACHABLE", "Não foi possível falar com a Evolution API.");
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) {
    if (res.status === 404) throw new NotFoundError("Instância não encontrada na Evolution API.");
    const detail = data?.response?.message ?? data?.message ?? data?.error;
    const text = Array.isArray(detail) ? detail.join(", ") : String(detail ?? `HTTP ${res.status}`);
    throw new HttpError(502, "EVOLUTION_ERROR", `Evolution API: ${text}`);
  }
  return data as T;
}

function normalizeStatus(raw: unknown): WhatsappStatus {
  return raw === "open" || raw === "connecting" ? raw : "close";
}

/** Aceita o formato v2 (campos na raiz) e v1 (dentro de `instance`). */
function mapInstance(raw: any): WhatsappInstance {
  const i = raw?.instance ?? raw;
  const jid: string | undefined = i.ownerJid ?? i.owner;
  return {
    name: i.name ?? i.instanceName,
    status: normalizeStatus(i.connectionStatus ?? i.status),
    number: i.number ?? (jid ? jid.split("@")[0] : null) ?? null,
    profileName: i.profileName ?? null,
    profilePicUrl: i.profilePicUrl ?? i.profilePictureUrl ?? null,
  };
}

function mapQr(raw: any): WhatsappQr {
  const qr = raw?.qrcode ?? raw;
  return {
    base64: qr?.base64 ?? null,
    pairingCode: qr?.pairingCode ?? null,
  };
}

function assertName(name: string) {
  if (!/^[a-zA-Z0-9_-]{2,40}$/.test(name)) {
    throw new BadRequestError("Nome inválido: use 2 a 40 letras, números, - ou _.");
  }
}

export type WhatsappBot = { prefix: string; label: string; webhookUrl: string | null };

/**
 * Bots que este painel alimenta. Cada bot tem um prefixo de instância e a URL do webhook dele.
 * EVOLUTION_BOTS="zc_=http://172.21.0.1:7000/webhook,outro_=http://172.21.0.1:7001/webhook"
 * Sem EVOLUTION_BOTS, vale o par antigo EVOLUTION_INSTANCE_PREFIX + EVOLUTION_WEBHOOK_URL.
 */
function bots(): WhatsappBot[] {
  const parsed = (env.EVOLUTION_BOTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const cut = entry.indexOf("=");
      const prefix = (cut === -1 ? entry : entry.slice(0, cut)).trim();
      const webhookUrl = cut === -1 ? null : entry.slice(cut + 1).trim() || null;
      return { prefix, label: prefix.replace(/[_-]+$/, "") || prefix, webhookUrl };
    })
    .filter((b) => b.prefix);

  if (parsed.length > 0) return parsed;
  const prefix = env.EVOLUTION_INSTANCE_PREFIX;
  return [{ prefix, label: prefix.replace(/[_-]+$/, "") || "padrão", webhookUrl: env.EVOLUTION_WEBHOOK_URL ?? null }];
}

/** Bot dono da instância: o de prefixo mais longo que casa com o nome. */
function botOf(name: string): WhatsappBot | null {
  return (
    bots()
      .filter((b) => name.startsWith(b.prefix))
      .sort((a, b) => b.prefix.length - a.prefix.length)[0] ?? null
  );
}

/** Impede operar em instâncias de outro painel/bot que dividem a mesma Evolution. */
function assertOwned(name: string) {
  assertName(name);
  if (!botOf(name)) {
    throw new NotFoundError("Instância não pertence a este painel.");
  }
}

export class WhatsappService {
  async list(): Promise<{
    instances: WhatsappInstance[];
    max: number;
    bots: Array<{ prefix: string; label: string }>;
  }> {
    const data = await evo<unknown[]>("GET", "/instance/fetchInstances");
    const instances = (Array.isArray(data) ? data : [])
      .map(mapInstance)
      .filter((i) => i.name && botOf(i.name))
      .map((i) => ({ ...i, bot: botOf(i.name)!.label }));
    return {
      instances,
      max: env.WHATSAPP_MAX_INSTANCES,
      bots: bots().map(({ prefix, label }) => ({ prefix, label })),
    };
  }

  async create(
    rawName: string,
    botPrefix?: string,
  ): Promise<{ instance: WhatsappInstance; qr: WhatsappQr }> {
    const available = bots();
    const bot = botPrefix === undefined ? (available.length === 1 ? available[0] : undefined) : available.find((b) => b.prefix === botPrefix);
    if (!bot) throw new BadRequestError("Escolha o bot que vai atender esta instância.");

    const name = rawName.startsWith(bot.prefix) ? rawName : `${bot.prefix}${rawName}`;
    assertName(name);
    const { instances, max } = await this.list();
    if (instances.length >= max) {
      throw new ConflictError(`Limite de ${max} aparelhos atingido. Exclua uma instância para criar outra.`);
    }
    if (instances.some((i) => i.name === name)) {
      throw new ConflictError("Já existe uma instância com esse nome.");
    }

    const created = await evo<any>("POST", "/instance/create", {
      instanceName: name,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      ...(bot.webhookUrl
        ? {
            webhook: {
              url: bot.webhookUrl,
              byEvents: false,
              base64: true,
              events: WEBHOOK_EVENTS,
            },
          }
        : {}),
    });

    return {
      instance: { name, status: "connecting", number: null, profileName: null, profilePicUrl: null, bot: bot.label },
      qr: mapQr(created),
    };
  }

  /** Gera um novo QR Code para conectar a instância. */
  async connect(name: string): Promise<WhatsappQr> {
    assertOwned(name);
    return mapQr(await evo<any>("GET", `/instance/connect/${encodeURIComponent(name)}`));
  }

  async state(name: string): Promise<{ status: WhatsappStatus }> {
    assertOwned(name);
    const data = await evo<any>("GET", `/instance/connectionState/${encodeURIComponent(name)}`);
    return { status: normalizeStatus(data?.instance?.state ?? data?.state) };
  }

  async disconnect(name: string): Promise<void> {
    assertOwned(name);
    await evo("DELETE", `/instance/logout/${encodeURIComponent(name)}`);
  }

  async remove(name: string): Promise<void> {
    assertOwned(name);
    await evo("DELETE", `/instance/delete/${encodeURIComponent(name)}`);
  }
}
