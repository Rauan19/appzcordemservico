const base = import.meta.env.VITE_API_URL?.trim() || "/api";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

export class PublicApiError extends Error {
  status: number;
  url?: string;
  bodyText?: string;
  constructor(status: number, message?: string, extras?: { url?: string; bodyText?: string }) {
    super(message ?? "Erro na requisição");
    this.status = status;
    this.url = extras?.url;
    this.bodyText = extras?.bodyText;
    this.name = "PublicApiError";
  }
}

export async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!res.ok) {
    throw new PublicApiError(res.status, data.message ?? data.error);
  }
  return data;
}

export async function publicUpload(
  token: string,
  type: string,
  file: File,
): Promise<unknown> {
  // type na query + no form (antes do file): multipart do Fastify
  // só garante fields que vêm antes do arquivo.
  const url = `${base}/public/contracts/${token}/documents?type=${encodeURIComponent(type)}`;
  const form = new FormData();
  form.append("type", type);
  form.append("file", file, file.name || "foto.jpg");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
    });
  } catch (e) {
    const cause = e instanceof Error ? e.message : String(e);
    throw new PublicApiError(0, `Failed to fetch (${cause})`, { url });
  }

  const raw = await res.text();
  let data: ApiErrorBody = {};
  try {
    data = raw ? (JSON.parse(raw) as ApiErrorBody) : {};
  } catch {
    data = { message: raw.slice(0, 300) || undefined };
  }
  if (!res.ok) {
    throw new PublicApiError(res.status, data.message ?? data.error ?? `HTTP ${res.status}`, {
      url,
      bodyText: raw.slice(0, 500),
    });
  }
  return data;
}

export async function publicSign(
  token: string,
  body: {
    signerName: string;
    signerCpf: string;
    acceptedTerms: true;
    signatureBase64: string;
    latitude?: number;
    longitude?: number;
  },
) {
  return publicApi<{ ok: boolean; status: string }>(`/public/contracts/${token}/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function publicDocumentUrl(token: string, type: string) {
  return `${base}/public/contracts/${token}/documents/${type}`;
}

export function publicSignatureUrl(token: string) {
  return `${base}/public/contracts/${token}/signature`;
}
