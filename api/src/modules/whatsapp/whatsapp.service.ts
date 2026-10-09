import { env } from "../../env.js";
import { BadRequestError, ConflictError, HttpError, NotFoundError } from "../../http/http-errors.ts";

export type WhatsappStatus = "open" | "connecting" | "close";

export type WhatsappInstance = {
  name: string;
  status: WhatsappStatus;
  number: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
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

const prefix = () => env.EVOLUTION_INSTANCE_PREFIX;

/** Nome completo na Evolution: aplica o prefixo deste painel, sem duplicar. */
function withPrefix(name: string) {
  return name.startsWith(prefix()) ? name : `${prefix()}${name}`;
}

/** Impede operar em instâncias de outro painel/bot que dividem a mesma Evolution. */
function assertOwned(name: string) {
  assertName(name);
  if (!name.startsWith(prefix())) {
    throw new NotFoundError("Instância não pertence a este painel.");
  }
}

export class WhatsappService {
  async list(): Promise<{ instances: WhatsappInstance[]; max: number }> {
    const data = await evo<unknown[]>("GET", "/instance/fetchInstances");
    const instances = (Array.isArray(data) ? data : []).map(mapInstance).filter((i) => i.name && i.name.startsWith(prefix()));
    return { instances, max: env.WHATSAPP_MAX_INSTANCES };
  }

  async create(rawName: string): Promise<{ instance: WhatsappInstance; qr: WhatsappQr }> {
    const name = withPrefix(rawName);
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
      ...(env.EVOLUTION_WEBHOOK_URL
        ? {
            webhook: {
              url: env.EVOLUTION_WEBHOOK_URL,
              byEvents: false,
              base64: true,
              events: WEBHOOK_EVENTS,
            },
          }
        : {}),
    });

    return {
      instance: { name, status: "connecting", number: null, profileName: null, profilePicUrl: null },
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
