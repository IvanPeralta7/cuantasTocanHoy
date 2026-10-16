/** Un día de la tira: la etiqueta (Hoy o la fecha corta) y cuántas pastillas tocan. */
function CycleDay({ day }) {
  const className = day.isToday ? "cycle-day is-today" : "cycle-day";
  return (
    <li className={className}>
      <span>{day.label}</span>
      <strong>{day.dose}</strong>
    </li>
  );
}

/** Lista de los próximos días del ciclo, con la cantidad de pastillas de cada uno. */
export function UpcomingCycle({ days, title }) {
  if (!days.length) return null;

  return (
    <section className="cycle" aria-label={title}>
      <p className="section-label">{title}</p>
      <ol className="cycle-list">
        {days.map((day) => (
          <CycleDay key={day.label} day={day} />
        ))}
      </ol>
    </section>
  );
}
