// Normalisation des erreurs HTTP en messages français exploitables par l'UI.

function detailToText(detail) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // Erreurs de validation FastAPI / Pydantic
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc) ? item.loc.filter((p) => p !== "body").join(".") : "";
        return field ? `${field} : ${item?.msg}` : item?.msg;
      })
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof detail === "object") return detail.message || JSON.stringify(detail);
  return String(detail);
}

const STATUS_MESSAGES = {
  400: "Requête invalide.",
  401: "Votre session a expiré. Veuillez vous reconnecter.",
  403: "Vous n'avez pas les droits nécessaires pour cette action.",
  404: "Ressource introuvable.",
  409: "Cette ressource existe déjà.",
  422: "Certaines données saisies sont invalides.",
  429: "Trop de requêtes. Patientez quelques instants avant de réessayer.",
  500: "Erreur interne du serveur.",
  502: "Le service distant a renvoyé une réponse invalide.",
  503: "Service temporairement indisponible.",
  504: "Le service met trop de temps à répondre.",
};

export class ApiError extends Error {
  constructor(message, { status = 0, detail = null, cause } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isUnavailable() {
    return this.status === 0 || this.status === 502 || this.status === 503 || this.status === 504;
  }
}

/** Convertit n'importe quelle erreur (axios ou autre) en ApiError. */
export function toApiError(error) {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  if (!response) {
    if (error?.code === "ECONNABORTED") {
      return new ApiError("Le serveur met trop de temps à répondre.", { status: 0, cause: error });
    }
    if (error?.request) {
      return new ApiError(
        "Serveur injoignable. Vérifiez que la gateway API est démarrée.",
        { status: 0, cause: error }
      );
    }
    return new ApiError(error?.message || "Erreur inattendue.", { status: 0, cause: error });
  }
  const { status, data } = response;
  const text = detailToText(data?.detail ?? data?.message);
  return new ApiError(text || STATUS_MESSAGES[status] || `Erreur HTTP ${status}`, {
    status,
    detail: data?.detail ?? null,
    cause: error,
  });
}

export function errorMessage(error, fallback = "Une erreur est survenue.") {
  if (!error) return fallback;
  return toApiError(error).message || fallback;
}
