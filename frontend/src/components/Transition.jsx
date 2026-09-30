import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, ServerCrash, WifiOff, RotateCw } from "lucide-react";

/**
 * Transition.jsx
 * ---------------------------------------------------------------
 * Effets de transition/attente réutilisables dans toute l'app.
 *
 * Cas d'usage visés :
 *  - la connexion (login/refresh token) prend plus de temps que prévu
 *    → afficher quelque chose de rassurant plutôt qu'un écran figé
 *  - le gateway répond 503 ("Service X indisponible") parce que le
 *    load balancer / un microservice est surchargé
 *    → au lieu de marteler l'API avec des requêtes immédiates,
 *      on patiente un peu (backoff progressif) pour laisser la charge
 *      retomber, tout en montrant une transition agréable
 *  - simple transition visuelle entre deux pages/écrans
 *
 * Le fichier exporte :
 *  - <Transition />      composant d'affichage (overlay / inline / page)
 *  - <PageTransition />  wrapper léger pour un fondu d'entrée de page
 *  - useRetryBackoff()   hook pour rejouer un appel réseau avec un
 *                        délai croissant (2s, 4s, 8s, ... plafonné)
 * ---------------------------------------------------------------
 */

// Messages par défaut selon le contexte de l'attente
const CONTEXT_PRESETS = {
  auth: {
    icon: Loader2,
    title: "Connexion en cours…",
    subtitle: "Vérification de vos identifiants, ça ne devrait plus être très long.",
    mascotVariant: "wave",
  },
  overload: {
    icon: ServerCrash,
    title: "Serveur très sollicité",
    subtitle: "On laisse quelques secondes au système pour souffler avant de réessayer.",
    mascotVariant: "default",
  },
  network: {
    icon: WifiOff,
    title: "Connexion instable",
    subtitle: "Nouvelle tentative de connexion en cours…",
    mascotVariant: "default",
  },
  default: {
    icon: Loader2,
    title: "Chargement…",
    subtitle: "Merci de patienter un instant.",
    mascotVariant: "default",
  },
};

/**
 * Composant principal.
 *
 * @param {boolean} active        - affiche/masque le composant (avec fondu).
 * @param {"overlay"|"inline"|"page"} variant
 *   - overlay : plein écran, par-dessus tout (login lent, session expirée...)
 *   - inline  : bloc compact intégrable dans une carte ou une section
 *   - page    : occupe la zone de contenu (remplace une page le temps du chargement)
 * @param {"auth"|"overload"|"network"|"default"} context - preset de message/icône.
 * @param {string} [title]        - surcharge le titre du preset.
 * @param {string} [subtitle]     - surcharge le sous-titre du preset.
 * @param {boolean} [mascot=true] - afficher la mascotte renard.
 * @param {number} [attempt]      - tentative en cours (pour l'affichage "Tentative X/Y").
 * @param {number} [maxAttempts]  - nombre max de tentatives.
 * @param {number} [progress]     - 0-100, affiche une barre de progression déterminée
 *                                  au lieu de l'animation indéterminée.
 */
export default function Transition({
  active = true,
  variant = "overlay",
  context = "default",
  title,
  subtitle,
  mascot = true,
  attempt,
  maxAttempts,
  progress,
  children,
}) {
  const preset = CONTEXT_PRESETS[context] || CONTEXT_PRESETS.default;
  const Icon = preset.icon;
  const finalTitle = title || preset.title;
  const finalSubtitle = subtitle || preset.subtitle;

  if (!active) return children ?? null;

  const isDeterminate = typeof progress === "number" && !Number.isNaN(progress);
  const clampedProgress = isDeterminate ? Math.max(0, Math.min(100, progress)) : null;

  const body = (
    <div className={`transition-card transition-${variant}`}>
      {mascot ? (
        <div className="transition-spinner transition-mascot" aria-hidden="true">
          <Icon size={variant === "inline" ? 26 : 34} strokeWidth={2} />
        </div>
      ) : (
        <div className="transition-spinner">
          <Icon size={variant === "inline" ? 26 : 34} strokeWidth={2} />
        </div>
      )}

      <div className="transition-text">
        <strong>{finalTitle}</strong>
        {finalSubtitle && <p>{finalSubtitle}</p>}
      </div>

      {typeof attempt === "number" && (
        <div className="transition-attempt">
          <RotateCw size={13} strokeWidth={2} />
          <span>
            Tentative {attempt}
            {maxAttempts ? ` / ${maxAttempts}` : ""}
          </span>
        </div>
      )}

      <div className={`transition-bar ${isDeterminate ? "determinate" : "indeterminate"}`}>
        <span style={isDeterminate ? { width: `${clampedProgress}%` } : undefined} />
      </div>
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="transition-overlay" role="status" aria-live="polite">
        {body}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className="transition-page" role="status" aria-live="polite">
        {body}
      </div>
    );
  }

  // inline
  return (
    <div className="transition-inline-wrap" role="status" aria-live="polite">
      {body}
    </div>
  );
}

/**
 * Wrapper léger pour un fondu d'entrée de page (transition entre routes).
 * S'utilise autour du contenu d'une page :
 *   <PageTransition><MaPage /></PageTransition>
 * `transitionKey` doit changer (ex: le pathname) pour redéclencher l'animation.
 */
export function PageTransition({ transitionKey, children }) {
  return (
    <div className="page-transition-wrap" key={transitionKey}>
      {children}
    </div>
  );
}

/**
 * Hook de rejeu avec backoff progressif.
 *
 * Rejoue `taskFn` en cas d'échec, en attendant un délai croissant entre
 * chaque tentative (baseDelayMs * factor^tentative, plafonné à maxDelayMs).
 * Pensé pour les erreurs 503 / "service indisponible" du gateway quand le
 * load balancer ou un microservice est surchargé : on laisse volontairement
 * du temps s'écouler avant de retaper l'API, au lieu de la marteler.
 *
 * @param {() => Promise<any>} taskFn
 * @param {object} [options]
 * @param {number} [options.maxAttempts=4]
 * @param {number} [options.baseDelayMs=1500]
 * @param {number} [options.maxDelayMs=15000]
 * @param {number} [options.factor=2]
 * @param {(error: any) => boolean} [options.shouldRetry] - décide si l'erreur
 *   mérite un nouvel essai (par défaut : réessaie sur toute erreur réseau
 *   ou statut HTTP 502/503/504).
 *
 * @returns {{
 *   run: () => Promise<any>,
 *   status: "idle"|"running"|"waiting"|"success"|"error",
 *   attempt: number,
 *   maxAttempts: number,
 *   delayMs: number,
 *   error: any,
 *   data: any,
 * }}
 */
export function useRetryBackoff(taskFn, options = {}) {
  const {
    maxAttempts = 4,
    baseDelayMs = 1500,
    maxDelayMs = 15000,
    factor = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  const [status, setStatus] = useState("idle");
  const [attempt, setAttempt] = useState(0);
  const [delayMs, setDelayMs] = useState(0);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const taskRef = useRef(taskFn);
  taskRef.current = taskFn;
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const run = useCallback(async () => {
    setStatus("running");
    setError(null);

    for (let i = 1; i <= maxAttempts; i += 1) {
      if (cancelledRef.current) return;
      setAttempt(i);
      try {
        const result = await taskRef.current();
        if (cancelledRef.current) return;
        setData(result);
        setStatus("success");
        return result;
      } catch (err) {
        if (cancelledRef.current) return;
        setError(err);

        const isLastAttempt = i === maxAttempts;
        if (isLastAttempt || !shouldRetry(err)) {
          setStatus("error");
          throw err;
        }

        const nextDelay = Math.min(baseDelayMs * factor ** (i - 1), maxDelayMs);
        setDelayMs(nextDelay);
        setStatus("waiting");
        await wait(nextDelay);
      }
    }
  }, [maxAttempts, baseDelayMs, maxDelayMs, factor, shouldRetry]);

  return { run, status, attempt, maxAttempts, delayMs, error, data };
}

function defaultShouldRetry(err) {
  // Pas de réponse du tout → probable souci réseau, on retente.
  if (!err?.response) return true;
  // 502/503/504 → gateway ou service en amont surchargé/indisponible.
  return [502, 503, 504].includes(err.response.status);
}