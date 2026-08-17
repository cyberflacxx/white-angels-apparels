import { useState } from "react";
import { Hero } from "../components/Hero";
import { api } from "../lib/api";

export function TrackOrder() {
  const [form, setForm] = useState({ orderNumber: "", phone: "" });
  const [result, setResult] = useState<any>(null);
  async function track() {
    const response = await api.post("/orders/track", form);
    setResult(response.data);
  }
  return (
    <main>
      <Hero title="Track Order" subtitle="Enter your order number and phone number to protect private order details." image="/images/hero-track-order.jpg" />
      <section className="section form-stack narrow">
        <input placeholder="Order number" onChange={(event) => setForm({ ...form, orderNumber: event.target.value })} />
        <input placeholder="Phone number" onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <button onClick={track}>Track Order</button>
        {result && <div className="summary"><h2>{result.order_number}</h2><p>Status: {result.order_status}</p><p>Payment: {result.payment_status}</p><p>Total: ${result.total}</p></div>}
      </section>
    </main>
  );
}
