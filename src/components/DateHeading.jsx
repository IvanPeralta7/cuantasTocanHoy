/** Muestra el día de la semana, la fecha y el año que se está consultando. */
export function DateHeading({ weekday, dayMonth, year }) {
  return (
    <>
      <p className="weekday">{weekday}</p>
      <p className="day">{dayMonth}</p>
      <p className="year">{year}</p>
    </>
  );
}
