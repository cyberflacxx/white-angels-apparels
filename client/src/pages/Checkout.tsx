import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "../components/Hero";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [fulfilmentMethod, setFulfilment] = useState<"HOME_DELIVERY" | "SHOP_COLLECTION">("HOME_DELIVERY");
  const [paymentMethod, setPayment] = useState<"ECOCASH" | "CASH">("ECOCASH");
  const [form, setForm] = useState<Record<string, string>>({});
  const deliveryFee = fulfilmentMethod === "HOME_DELIVERY" ? 5 : 0;
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);
  async function placeOrder() {
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
  }
  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <main>
      <Hero title="Checkout" subtitle="Choose delivery or collection, then EcoCash or cash." image="/images/hero-checkout.jpg" />
      <section className="section checkout-grid">
        <div className="form-stack">
          <h2>Customer Information</h2>
          {["fullName", "phone", "alternatePhone", "email"].map((key) => <input key={key} placeholder={key.replace(/([A-Z])/g, " $1")} onChange={set(key)} />)}
          <textarea placeholder="Customer notes" onChange={set("notes")} />
          <h2>Fulfilment</h2>
          <div className="segmented"><button className={fulfilmentMethod === "HOME_DELIVERY" ? "active" : ""} onClick={() => setFulfilment("HOME_DELIVERY")}>Home Delivery</button><button className={fulfilmentMethod === "SHOP_COLLECTION" ? "active" : ""} onClick={() => setFulfilment("SHOP_COLLECTION")}>Shop Collection</button></div>
          {fulfilmentMethod === "HOME_DELIVERY" ? ["province", "city", "suburb", "street", "houseNumber", "landmark", "deliveryInstructions"].map((key) => <input key={key} placeholder={key.replace(/([A-Z])/g, " $1")} onChange={set(key)} />) : <p>Collection instructions are configurable in backend settings and will be shown after confirmation.</p>}
          <h2>Payment</h2>
          <div className="segmented"><button className={paymentMethod === "ECOCASH" ? "active" : ""} onClick={() => setPayment("ECOCASH")}>EcoCash</button><button className={paymentMethod === "CASH" ? "active" : ""} onClick={() => setPayment("CASH")}>{fulfilmentMethod === "HOME_DELIVERY" ? "Cash on Delivery" : "Cash on Collection"}</button></div>
          {paymentMethod === "ECOCASH" && <><input placeholder="EcoCash phone number" onChange={set("ecocashPhone")} /><input placeholder="EcoCash transaction/reference number" onChange={set("ecocashReference")} /><input type="file" /></>}
        </div>
        <aside className="summary"><h2>Final Summary</h2>{items.map((item) => <p key={item.product.id}>{item.quantity} x {item.product.name}</p>)}<p>Subtotal: ${subtotal.toFixed(2)}</p><p>Delivery: ${deliveryFee.toFixed(2)}</p><h3>Total: ${total.toFixed(2)}</h3><p>{paymentMethod} · {fulfilmentMethod}</p><button onClick={placeOrder}>Place Order</button></aside>
      </section>
    </main>
  );
}
