import { ActionBar } from "./ActionBar.jsx";

/** Tarjeta central: la dosis de hoy, el detalle del saldo y los avisos. */
export function DoseCard({ view, notice, onAction }) {
  return (
    <section className={`card card-${view.mode}`} aria-live="polite">
      <p className="summary">{view.summary}</p>
      {view.banner ? <p className="banner">{view.banner}</p> : null}
      <p className="kicker">{view.kicker}</p>
      {view.amount !== null ? (
        <>
          <p className="dose">{view.amount}</p>
          <p className="unit">{view.unit}</p>
        </>
      ) : null}
      {view.detail ? <p className="detail">{view.detail}</p> : null}
      {view.nextLine ? <p className="next">{view.nextLine}</p> : null}
      {view.note ? <p className="note">{view.note}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}
      <ActionBar actions={view.actions} onAction={onAction} />
    </section>
  );
}
