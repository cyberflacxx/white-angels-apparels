import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreenButton, faStore, faTruck, faWallet } from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hero } from "../components/Hero";
import { AppButton, AppLink, Container, EmptyState, Field, Section, TextAreaField } from "../components/UI";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { useSiteSettings } from "./hooks";

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const settings = useSiteSettings();
  const navigate = useNavigate();
  const [fulfilmentMethod, setFulfilment] = useState<"HOME_DELIVERY" | "SHOP_COLLECTION">("HOME_DELIVERY");
  const [paymentMethod, setPayment] = useState<"ECOCASH" | "CASH">("ECOCASH");
  const [form, setForm] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const deliveryFee = fulfilmentMethod === "HOME_DELIVERY" ? Number(settings.defaultDeliveryFee ?? 5) : 0;
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  async function placeOrder() {
    setError("");
    setPlacing(true);
    try {
      const payload = {
        customer: { fullName: form.fullName, phone: form.phone, alternatePhone: form.alternatePhone, email: form.email, notes: form.notes },
        fulfilmentMethod,
        deliveryAddress: form,
        paymentMethod,
        payment: { ecocashPhone: form.ecocashPhone, ecocashReference: form.ecocashReference },
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      };
      const response = await api.post("/orders", payload);
      clearCart();
      navigate(`/order-success/${response.data.order_number}`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not place this order. Please check the form and try again.");
    } finally {
      setPlacing(false);
    }
  }
  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <main>
      <Hero title="Complete your order." subtitle="Simple customer details, fulfilment, payment, and review." image="/images/hero-checkout.jpg" compact />
      <Section>
        <Container className="checkout-grid">
          <div className="checkout-flow">
            {!items.length && <EmptyState title="Your cart is empty" copy="Add products before checking out." action={<AppLink to="/shop">Shop Now</AppLink>} />}
            <Step number="1" title="Customer Details">
              <div className="form-grid">
                <Field label="Full name" value={form.fullName || ""} onChange={set("fullName")} required />
                <Field label="Phone" value={form.phone || ""} onChange={set("phone")} required />
                <Field label="Alternate phone" value={form.alternatePhone || ""} onChange={set("alternatePhone")} />
                <Field label="Email" type="email" value={form.email || ""} onChange={set("email")} />
                <TextAreaField label="Customer notes" className="span-2" value={form.notes || ""} onChange={set("notes")} />
              </div>
            </Step>
            <Step number="2" title="Receive Your Order">
              <div className="choice-grid">
                <Choice selected={fulfilmentMethod === "HOME_DELIVERY"} icon={faTruck} title="Home Delivery" copy="Send this order to your address." onClick={() => setFulfilment("HOME_DELIVERY")} />
                <Choice selected={fulfilmentMethod === "SHOP_COLLECTION"} icon={faStore} title="Shop Collection" copy={settings.collectionInstructions} onClick={() => setFulfilment("SHOP_COLLECTION")} />
              </div>
              {fulfilmentMethod === "HOME_DELIVERY" && (
                <div className="form-grid">
                  {["province", "city", "suburb", "street", "houseNumber", "landmark", "deliveryInstructions"].map((key) => <Field key={key} label={key.replace(/([A-Z])/g, " $1")} value={form[key] || ""} onChange={set(key)} />)}
                </div>
              )}
            </Step>
            <Step number="3" title="Payment">
              <div className="choice-grid">
                <Choice selected={paymentMethod === "ECOCASH"} icon={faMobileScreenButton} title="EcoCash" copy="Submit details for manual verification." onClick={() => setPayment("ECOCASH")} />
                <Choice selected={paymentMethod === "CASH"} icon={faWallet} title={fulfilmentMethod === "HOME_DELIVERY" ? "Cash on Delivery" : "Cash on Collection"} copy="Pay when receiving the order." onClick={() => setPayment("CASH")} />
              </div>
              {paymentMethod === "ECOCASH" && (
                <div className="form-grid">
                  <Field label="EcoCash phone number" value={form.ecocashPhone || ""} onChange={set("ecocashPhone")} />
                  <Field label="EcoCash transaction/reference number" value={form.ecocashReference || ""} onChange={set("ecocashReference")} />
                  <Field label="Payment proof" type="file" />
                </div>
              )}
            </Step>
          </div>
          <aside className="summary">
            <h2>Review</h2>
            {items.map((item) => <p key={item.product.id}><span>{item.quantity} x {item.product.name}</span><strong>${(Number(item.product.price) * item.quantity).toFixed(2)}</strong></p>)}
            <p><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></p>
            <p><span>Delivery</span><strong>${deliveryFee.toFixed(2)}</strong></p>
            <p className="summary__total"><span>Total</span><strong>${total.toFixed(2)}</strong></p>
            <p className="muted">{paymentMethod} / {fulfilmentMethod}</p>
            {error && <div className="error-card">{error}</div>}
            {items.length ? <AppButton onClick={placeOrder} disabled={placing}>{placing ? "Placing..." : "Place Order"}</AppButton> : <Link className="btn btn--secondary" to="/shop">Return to Shop</Link>}
          </aside>
        </Container>
      </Section>
    </main>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="checkout-step">
      <h2><span>{number}</span>{title}</h2>
      {children}
    </section>
  );
}

function Choice({ icon, title, copy, selected, onClick }: { icon: any; title: string; copy: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={selected ? "choice-card choice-card--selected" : "choice-card"} onClick={onClick}>
      <FontAwesomeIcon icon={icon} />
      <strong>{title}</strong>
      <span>{copy}</span>
    </button>
  );
}
