import { emptyState, normalizeState } from "./logic.js";

const STORAGE_KEY = "recorda-cuantas-son-hoy";

/** Lee el estado guardado en el navegador, o uno vacío si no hay nada o está dañado. */
export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return normalizeState(saved ? JSON.parse(saved) : null);
  } catch {
    return emptyState();
  }
}

/** Guarda deuda y saldo para que sigan ahí al recargar la página. */
export function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
