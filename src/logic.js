/** Fecha en que empieza el esquema: 16 de octubre de 2026. */
const START = new Date(2026, 9, 16);

/** Fecha de la última toma: 31 de diciembre de 2026. */
const END = new Date(2026, 11, 31);

/** Locale usado para los nombres de días y meses. */
const LOCALE = "es-AR";

/** Quita la hora para que dos fechas del mismo día se comparen iguales. */
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Suma o resta días corridos y devuelve esa fecha a medianoche. */
function addDays(date, amount) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Cuántos días pasaron desde el inicio del esquema. El día de inicio es 0. */
function daysFromStart(date) {
  const ms = startOfDay(date) - START;
  return Math.round(ms / 86400000);
}

/** Fecha en formato AAAA-MM-DD, según el calendario local. */
function isoLocal(date) {
  const day = startOfDay(date);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const dateNumber = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${dateNumber}`;
}

/** Pone en mayúscula la primera letra, respetando el español. */
function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toLocaleUpperCase(LOCALE) + value.slice(1);
}

/** Pastillas que tocan ese día: 2 en los pares y 1 en los impares. Null fuera del esquema. */
function scheduledDose(date) {
  const index = daysFromStart(date);
  const lastIndex = daysFromStart(END);
  if (index < 0 || index > lastIndex) return null;
  return index % 2 === 0 ? 2 : 1;
}

/** Estado inicial: sin deuda ni toma saldada. */
export function emptyState() {
  return {
    owed: 0,
    missedDate: null,
    settledOn: null,
    settledAmount: 0,
    settledTodayDose: 0,
    settledOwed: 0,
  };
}

/** Completa y corrige un estado leído de disco para que siempre tenga la misma forma. */
export function normalizeState(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== "object") return base;
  const owed = Number(raw.owed);
  return {
    owed: Number.isFinite(owed) && owed > 0 ? owed : 0,
    missedDate: typeof raw.missedDate === "string" ? raw.missedDate : null,
    settledOn: typeof raw.settledOn === "string" ? raw.settledOn : null,
    settledAmount: Number(raw.settledAmount) > 0 ? Number(raw.settledAmount) : 0,
    settledTodayDose: Number(raw.settledTodayDose) > 0 ? Number(raw.settledTodayDose) : 0,
    settledOwed: Number(raw.settledOwed) > 0 ? Number(raw.settledOwed) : 0,
  };
}

/** Parte una fecha en textos listos para mostrar: día de semana, fecha y año. */
function dateParts(date) {
  const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: "long" }).format(date);
  const day = new Intl.DateTimeFormat(LOCALE, { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat(LOCALE, { month: "long" }).format(date);
  const year = new Intl.DateTimeFormat(LOCALE, { year: "numeric" }).format(date);
  return {
    weekday: capitalize(weekday),
    dayMonth: `${day} de ${month}`,
    year,
    shortLabel: `${day} ${month.slice(0, 3)}`,
  };
}

/** Elige "pastilla" o "pastillas" según la cantidad. */
function pillNoun(amount) {
  return amount === 1 ? "pastilla" : "pastillas";
}

/** Arma la frase de una cantidad, por ejemplo "2 pastillas". */
function dosePhrase(amount) {
  return `${amount} ${pillNoun(amount)}`;
}

/** Conjuga "toca" o "tocan" según haya una pastilla o más. */
function verbToca(amount) {
  return amount === 1 ? "toca" : "tocan";
}

/** Explica de dónde sale el total: lo de hoy más lo que quedó pendiente. */
function breakdown(todayDose, owed, fromYesterday) {
  const owedLabel = fromYesterday
    ? `${owed} de ayer`
    : `${owed} pendiente${owed === 1 ? "" : "s"}`;
  return `${todayDose} de hoy + ${owedLabel}`;
}

/** Arma la tira de días del ciclo que todavía entran en el esquema. */
function upcomingDays(date, count, startOffset) {
  const days = [];
  for (let offset = startOffset; offset < startOffset + count; offset += 1) {
    const current = addDays(date, offset);
    const dose = scheduledDose(current);
    if (dose === null) break;
    const parts = dateParts(current);
    days.push({
      label: offset === 0 ? "Hoy" : parts.shortLabel,
      dose,
      isToday: offset === 0,
    });
  }
  return days;
}

/**
 * Suma la dosis de ayer a lo pendiente.
 * No cambia nada si ayer no había esquema, si esa falta ya se anotó o si hoy ya se saldó.
 */
export function reportMissedYesterday(date, state) {
  const current = normalizeState(state);
  const yesterday = addDays(date, -1);
  const yesterdayDose = scheduledDose(yesterday);
  if (yesterdayDose === null) return { state: current, error: "before-scheme" };
  if (current.settledOn === isoLocal(date)) return { state: current, error: "settled" };

  const missedDate = isoLocal(yesterday);
  if (current.missedDate === missedDate) return { state: current, error: "already" };

  return {
    state: {
      ...current,
      owed: current.owed + yesterdayDose,
      missedDate,
      settledOn: null,
      settledAmount: 0,
      settledTodayDose: 0,
      settledOwed: 0,
    },
    error: null,
  };
}

/** Marca como tomada la dosis de hoy más la deuda, y guarda el total para mostrarlo. */
export function settle(date, state) {
  const current = normalizeState(state);
  const todayDose = scheduledDose(date);
  if (!current.owed || todayDose === null) return current;
  return {
    ...current,
    owed: 0,
    settledOn: isoLocal(date),
    settledAmount: todayDose + current.owed,
    settledTodayDose: todayDose,
    settledOwed: current.owed,
  };
}

/** Vuelve atrás el último cambio: si había un saldo, restaura la deuda; si no, limpia todo. */
export function undo(state) {
  const current = normalizeState(state);
  if (current.settledOn) {
    return {
      ...current,
      owed: current.settledOwed,
      settledOn: null,
      settledAmount: 0,
      settledTodayDose: 0,
      settledOwed: 0,
    };
  }
  return emptyState();
}

/** Traduce la fecha y el estado a todo lo que la pantalla necesita mostrar. */
export function buildView(date, rawState) {
  const state = normalizeState(rawState);
  const parts = dateParts(date);
  const todayDose = scheduledDose(date);
  const todayIso = isoLocal(date);
  const yesterday = addDays(date, -1);
  const yesterdayIso = isoLocal(yesterday);
  const yesterdayDose = scheduledDose(yesterday);
  const tomorrowDose = scheduledDose(addDays(date, 1));
  const base = {
    weekday: parts.weekday,
    dayMonth: parts.dayMonth,
    year: parts.year,
    upcoming: [],
    upcomingTitle: "",
    actions: [],
    banner: "",
    detail: "",
    note: "",
    nextLine: "",
    amount: null,
    kicker: "",
    unit: "",
  };

  if (todayDose === null) {
    const before = startOfDay(date) < START;
    return {
      ...base,
      mode: before ? "before" : "after",
      kicker: before ? "Todavía no empieza" : "El esquema ya terminó",
      note: before
        ? "Empieza el 16 de octubre de 2026. Ese día tocan 2 pastillas."
        : "La última toma fue el 31 de diciembre de 2026.",
      summary: `${parts.weekday} ${parts.dayMonth} de ${parts.year}. ${
        before ? "El esquema todavía no empieza." : "El esquema ya terminó."
      }`,
    };
  }

  const isFirstDay = yesterdayDose === null;
  const isLastDay = daysFromStart(date) === daysFromStart(END);
  let cycleNote = "El esquema alterna 2 y 1 hasta el 31 de diciembre.";
  if (isFirstDay) {
    cycleNote=  "Si un día no tomás la dosis, al siguiente se suma.";
  } else if (isLastDay) {
    cycleNote = "Hoy es el último día. El esquema alterna 2 y 1.";
  }

  if (state.settledOn === todayIso && state.settledAmount > 0) {
    const fromYesterday = state.missedDate === yesterdayIso && state.settledOwed === yesterdayDose;
    const nextLine = tomorrowDose === null
      ? "Con esta toma termina el esquema."
      : `Mañana te ${verbToca(tomorrowDose)} ${dosePhrase(tomorrowDose)}. El ciclo sigue igual.`;
    return {
      ...base,
      mode: "settled",
      kicker: "Quedó saldado",
      amount: state.settledAmount,
      unit: state.settledAmount === 1 ? "pastilla tomada" : "pastillas tomadas",
      detail: breakdown(state.settledTodayDose, state.settledOwed, fromYesterday),
      nextLine,
      upcoming: upcomingDays(date, 6, 1),
      upcomingTitle: "Después, el ciclo sigue",
      actions: [{ id: "undo", label: "Deshacer", variant: "text" }],
      summary: `${parts.weekday} ${parts.dayMonth} de ${parts.year}. Tomaste ${dosePhrase(state.settledAmount)}. ${nextLine}`,
    };
  }

  const owed = state.owed;
  const total = todayDose + owed;
  const fromYesterday = owed > 0 && state.missedDate === yesterdayIso && owed === yesterdayDose;
  const actions = [];
  if (owed > 0) {
    actions.push({ id: "settle", label: "Ya tomé esta cantidad", variant: "primary" });
  }
  if (state.missedDate !== yesterdayIso) {
    actions.push({
      id: "miss",
      label: "Ayer no tomé la dosis",
      variant: owed > 0 ? "text" : "ghost",
    });
  }
  if (owed > 0) {
    actions.push({ id: "undo", label: "Deshacer", variant: "text" });
  }

  return {
    ...base,
    mode: owed > 0 ? "debt" : "today",
    kicker: owed > 0 ? `Hoy te ${verbToca(total)}` : `Hoy te ${verbToca(todayDose)}`,
    amount: owed > 0 ? total : todayDose,
    unit: pillNoun(owed > 0 ? total : todayDose),
    banner: owed > 0
      ? (fromYesterday ? "Se sumó la dosis de ayer" : "Sigue pendiente una dosis anterior")
      : "",
    detail: owed > 0 ? breakdown(todayDose, owed, fromYesterday) : "",
    note: owed > 0 ? "Cuando tomás esta cantidad, el ciclo vuelve a 2 y 1." : cycleNote,
    upcoming: upcomingDays(date, 6, owed > 0 ? 1 : 0),
    upcomingTitle: owed > 0 ? "Después, el ciclo sigue" : "Los próximos días",
    actions,
    summary: `${parts.weekday} ${parts.dayMonth} de ${parts.year}. Hoy te ${verbToca(owed > 0 ? total : todayDose)} ${dosePhrase(owed > 0 ? total : todayDose)}.`,
  };
}
