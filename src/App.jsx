import { useState } from "react";
import { DateHeading } from "./components/DateHeading.jsx";
import { DoseCard } from "./components/DoseCard.jsx";
import { Masthead } from "./components/Masthead.jsx";
import { UpcomingCycle } from "./components/UpcomingCycle.jsx";
import { buildView, reportMissedYesterday, settle, undo } from "./logic.js";
import { loadState, persist } from "./storage.js";

/** Arma la pantalla del día: carga lo guardado, aplica las acciones y muestra cada pieza. */
export function App() {
  const [state, setState] = useState(loadState);
  const [notice, setNotice] = useState("");
  const view = buildView(new Date(), state);

  /** Aplica la acción del botón, avisa si no se puede y guarda el resultado. */
  function handleAction(actionId) {
    const today = new Date();
    setNotice("");

    if (actionId === "miss") {
      const result = reportMissedYesterday(today, state);
      if (result.error === "before-scheme") {
        setNotice("Hoy empieza el esquema. No hay una dosis de ayer para sumar.");
        return;
      }
      if (!result.error) commit(result.state);
      return;
    }

    if (actionId === "settle") {
      commit(settle(today, state));
      return;
    }

    if (actionId === "undo") {
      commit(undo(state));
    }
  }

  /** Deja el estado nuevo en pantalla y en el almacenamiento del navegador. */
  function commit(next) {
    setState(next);
    persist(next);
  }

  return (
    <div className="scene">
      <main className="app">
        <Masthead />
        <DateHeading
          weekday={view.weekday}
          dayMonth={view.dayMonth}
          year={view.year}
        />
        <DoseCard view={view} notice={notice} onAction={handleAction} />
        <UpcomingCycle days={view.upcoming} title={view.upcomingTitle} />
      </main>
    </div>
  );
}
