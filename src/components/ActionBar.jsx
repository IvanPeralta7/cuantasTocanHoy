/** Elige la clase visual del botón: acción principal, enlace o botón común. */
function buttonClass(variant) {
  if (variant === "primary") return "button primary";
  if (variant === "text") return "button-text";
  return "button";
}

/** Botones de la tarjeta. Cada uno dispara una acción del esquema. */
export function ActionBar({ actions, onAction }) {
  if (!actions.length) return null;

  return (
    <div className="actions">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={buttonClass(action.variant)}
          onClick={() => onAction(action.id)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
