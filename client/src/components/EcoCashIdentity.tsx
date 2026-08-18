export function EcoCashIdentity({
  merchantName,
  merchantNumber,
  instruction,
  className = "payment-method-card"
}: {
  merchantName: string;
  merchantNumber: string;
  instruction: string;
  className?: string;
}) {
  return (
    <article className={`${className} payment-method-card--ecocash`}>
      <div className="payment-method-card__brand">
        <span className="payment-logo-badge" aria-hidden="true">
          <span className="payment-logo-badge__eco">Eco</span>
          <span className="payment-logo-badge__cash">Cash</span>
        </span>
        <div>
          <strong>EcoCash</strong>
          <p>{merchantName}</p>
        </div>
      </div>
      <div className="payment-method-card__details">
        <span>{merchantNumber || "Merchant number can be added in Admin Settings."}</span>
        <small>{instruction}</small>
      </div>
    </article>
  );
}
