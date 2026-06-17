const base = import.meta.env.VITE_API_URL?.trim() || "/api";

type ApiErrorBody = {
  error?: string;
  message?: string;
};

export class PublicApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? "Erro na requisição");
    this.status = status;
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
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const res = await fetch(`${base}/public/contracts/${token}/documents`, {
    method: "POST",
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PublicApiError(res.status, data.message ?? data.error);
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
