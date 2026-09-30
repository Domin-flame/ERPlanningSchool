import React, { useState, useSyncExternalStore } from "react";

/**
 ---------------------------------------------------------------
 * ORGANISATION DES ASSETS ATTENDUE
 * ---------------------------------------------------------------
 * src/assets/mascots/fox-default.png
 * src/assets/mascots/fox-wave.png
 * src/assets/mascots/fox-sleep.png
 * src/assets/mascots/fox-empty.png
 * src/assets/mascots/fox-error.png
 *
 * Ajustez les chemins d'import ci-dessous selon l'emplacement réel
 * de vos fichiers. Le format PNG/WebP avec fond transparent est
 * recommandé (SVG aussi si vos assets sont vectoriels).
 * ---------------------------------------------------------------
 */

import foxDefault from "../assets/mascote2_cwf.png";
import foxWave from "../assets/mascote_cwf.png";
// Some mascot variants may be missing in this repo (packaging/build). Use
// existing images as sensible fallbacks to avoid build failures.
const foxSleep = foxWave;
const foxEmpty = foxDefault;
const foxError = foxDefault;

// ---------------------------------------------------------------
// REGISTRE DE VARIANTES
// ---------------------------------------------------------------
// Contrairement à un simple objet, ce registre notifie les composants
// FoxMascot montés lorsqu'une variante est ajoutée après coup (via
// ajouterMascotte), pour qu'ils se re-rendent automatiquement.

const variantRegistry = {
  default: foxDefault,
  wave: foxWave,
  sleep: foxSleep, // fallback to wave if specific asset missing
  empty: foxEmpty,
  error: foxError,
};

const listeners = new Set();

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  for (const callback of listeners) callback();
}

function getSnapshot() {
  return variantRegistry;
}

/**
 * Ajoute (ou remplace) une variante de mascotte.
 *
 * @param {string} cle - nom de la variante, ex: "confetti"
 * @param {string} asset - chemin/import de l'image (résultat d'un import
 *   statique, ou une URL/base64 si l'asset vient d'ailleurs)
 *
 * @example
 *   import foxConfetti from "../assets/mascots/fox-confetti.png";
 *   ajouterMascotte("confetti", foxConfetti);
 *   // <FoxMascot variant="confetti" /> fonctionne immédiatement,
 *   // y compris dans les composants déjà montés.
 */
export function ajouterMascotte(cle, asset) {
  if (!cle || typeof cle !== "string") {
    throw new Error("ajouterMascotte: `cle` doit être une chaîne non vide.");
  }
  if (!asset) {
    throw new Error("ajouterMascotte: `asset` est requis (import ou URL).");
  }
  variantRegistry[cle] = asset;
  notifyListeners();
}

/**
 * Variante asynchrone : charge l'asset via import() dynamique
 * (utile pour du code-splitting si vous avez beaucoup de mascottes
 * et ne voulez pas toutes les inclure dans le bundle initial).
 *
 * @example
 *   await ajouterMascotteAsync("confetti", () => import("../assets/mascots/fox-confetti.png"));
 */
export async function ajouterMascotteAsync(cle, importFn) {
  const module = await importFn();
  ajouterMascotte(cle, module.default ?? module);
}

export default function FoxMascot({
  size = 120,
  variant = "default",
  className = "",
  alt = "Mascotte renard CampusWorkflow",
}) {
  const [failed, setFailed] = useState(false);
  const registry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const src = registry[variant] ?? registry.default;

  // Si l'image ne charge pas (mauvais chemin, asset manquant),
  // on retombe sur la variante par défaut plutôt que sur une icône cassée.
  const finalSrc = failed ? registry.default : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
      style={{ objectFit: "contain", userSelect: "none" }}
    />
  );
}
// il faut que j'ajoute les images manquantes de la mascote dans tous les états nécessaires pour le système 
// ajouter des animations 2d de celle ci pour qu'elle soit plus attrayante
// la mascote va servir d'icone pour l'ia à implémenter plus tard 