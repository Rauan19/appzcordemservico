import { Alert } from "react-native";
import { ApiRequestError } from "@/src/lib/api";

export type ErrorContext =
  | "login"
  | "loadOrders"
  | "loadOrder"
  | "updateOrderStatus"
  | "saveTechnicianReport"
  | "orderMaterials"
  | "loadEvaluations"
  | "saveEvaluation"
  | "loadStock"
  | "generic";

export type FriendlyError = {
  title: string;
  message: string;
};

const CONTEXT_DEFAULTS: Record<ErrorContext, FriendlyError> = {
  login: {
    title: "Não foi possível entrar",
    message: "Não conseguimos validar suas credenciais. Tente novamente em instantes.",
  },
  loadOrders: {
    title: "Erro ao carregar OS",
    message: "Não foi possível buscar as ordens de serviço. Puxe a lista para tentar de novo.",
  },
  loadOrder: {
    title: "Erro ao abrir OS",
    message: "Não foi possível carregar os detalhes desta ordem. Volte e tente novamente.",
  },
  updateOrderStatus: {
    title: "Status não atualizado",
    message: "Não foi possível alterar o status da OS. Verifique e tente novamente.",
  },
  saveTechnicianReport: {
    title: "Relatório não salvo",
    message: "Não foi possível salvar o relatório do técnico. Tente novamente.",
  },
  orderMaterials: {
    title: "Operação não concluída",
    message: "Não foi possível registrar os produtos. Confira os dados e tente de novo.",
  },
  loadEvaluations: {
    title: "Erro ao carregar",
    message: "Não foi possível buscar as avaliações. Puxe a lista para atualizar.",
  },
  saveEvaluation: {
    title: "Avaliação não salva",
    message: "Não conseguimos registrar a avaliação do cliente. Tente novamente.",
  },
  loadStock: {
    title: "Erro no estoque",
    message: "Não foi possível carregar o saldo de produtos. Puxe a lista para tentar de novo.",
  },
  generic: {
    title: "Algo deu errado",
    message: "Ocorreu um problema inesperado. Tente novamente em instantes.",
  },
};

const CODE_MESSAGES: Record<string, string> = {
  INTERNAL_SERVER_ERROR:
    "Problema temporário no servidor. Se persistir, avise a equipe de suporte.",
  VALIDATION_ERROR: "Confira os dados informados e tente novamente.",
  BAD_REQUEST: "Os dados enviados não puderam ser processados.",
  UNAUTHORIZED: "Sessão expirada ou credenciais inválidas.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "Registro não encontrado ou removido.",
  CONFLICT: "Esta ação conflita com outro registro existente.",
  ERROR: "Não foi possível completar a operação.",
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "Requisição inválida. Verifique os dados e tente de novo.",
  401: "Sessão expirada. Faça login novamente.",
  403: "Sem permissão para esta ação.",
  404: "Informação não encontrada.",
  409: "Conflito  a operação não pôde ser concluída.",
  422: "Dados inválidos. Revise o que foi informado.",
  429: "Muitas tentativas. Aguarde um momento e tente de novo.",
  500: "Problema no servidor. Tente novamente em instantes.",
  502: "Servidor temporariamente indisponível.",
  503: "Serviço em manutenção. Tente mais tarde.",
};

const GENERIC_API_MESSAGES = new Set([
  "ERROR",
  "INTERNAL_SERVER_ERROR",
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "VALIDATION_ERROR",
  "Requisição inválida",
  "Não autorizado",
  "Sem permissão",
  "Não encontrado",
  "Conflito",
]);

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === "TypeError" &&
    (msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("internet") ||
      msg.includes("timeout") ||
      msg.includes("aborted"))
  );
}

function isGenericApiMessage(code: string, message: string): boolean {
  return !message.trim() || message === code || GENERIC_API_MESSAGES.has(message);
}

function titleForApiError(err: ApiRequestError, context: ErrorContext): string {
  if (context === "login") {
    if (err.status === 401 || err.code === "UNAUTHORIZED") return "E-mail ou senha incorretos";
    return CONTEXT_DEFAULTS.login.title;
  }

  if (err.status === 401) return "Sessão expirada";
  if (err.status === 403) return "Sem permissão";
  if (err.status === 404) return "Não encontrado";
  if (err.status >= 500) return "Problema no servidor";

  return CONTEXT_DEFAULTS[context].title;
}

function messageForApiError(err: ApiRequestError, context: ErrorContext): string {
  if (!isGenericApiMessage(err.code, err.message)) {
    return err.message;
  }

  if (context === "login" && (err.status === 401 || err.code === "UNAUTHORIZED")) {
    return "Confira seu e-mail e senha de técnico. Se o erro continuar, peça ajuda ao administrador.";
  }

  return (
    CODE_MESSAGES[err.code] ??
    STATUS_MESSAGES[err.status] ??
    CONTEXT_DEFAULTS[context].message
  );
}

export function getFriendlyError(
  err: unknown,
  context: ErrorContext = "generic",
): FriendlyError {
  const defaults = CONTEXT_DEFAULTS[context];

  if (isNetworkError(err)) {
    return {
      title: context === "login" ? "Sem conexão com o servidor" : "Sem conexão",
      message:
        "Não foi possível comunicar com a API. Verifique a internet do tablet e se o sistema está online.",
    };
  }

  if (err instanceof ApiRequestError) {
    return {
      title: titleForApiError(err, context),
      message: messageForApiError(err, context),
    };
  }

  if (err instanceof Error && err.message.trim()) {
    return { title: defaults.title, message: err.message };
  }

  return defaults;
}

export function showErrorAlert(err: unknown, context: ErrorContext = "generic"): void {
  const { title, message } = getFriendlyError(err, context);
  Alert.alert(title, message);
}
