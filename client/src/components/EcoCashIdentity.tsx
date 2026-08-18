export function EcoCashWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="payment-logo-badge__eco">Eco</span>
      <span className="payment-logo-badge__cash">Cash</span>
    </span>
  );
}

export function EcoCashIdentity({ className = "payment-method-card" }: { className?: string }) {
  return (
    <article className={`${className} payment-method-card--ecocash`}>
      <div className="payment-method-card__brand">
        <EcoCashWordmark className="payment-logo-badge" />
        <div>
          <strong><EcoCashWordmark /></strong>
          <p>White Angels</p>
        </div>
      </div>
      <div className="payment-method-card__details">
        <span>Name: Genius Musonza</span>
        <small>EcoCash Number: 0786870610</small>
      </div>
    </article>
  );
}
