import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faCheck, faClipboardCheck, faTruck } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Hero } from "../components/Hero";
import { AppButton, Container, Field, Section } from "../components/UI";
import { api } from "../lib/api";
import { useSiteSettings } from "./hooks";

export function TrackOrder() {
  const [form, setForm] = useState({ orderNumber: "", phone: "" });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const { settings } = useSiteSettings();
  async function track() {
    setError("");
    try {
      const response = await api.post("/orders/track", form);
      setResult(response.data);
    } catch (requestError: any) {
      setResult(null);
      setError(requestError?.response?.data?.message || "Order not found. Check the order number and phone.");
    }
  }
  return (
    <main>
      <Hero title="Where is your order?" subtitle="Enter your order number and phone number to protect private order details." image={settings.heroTrackOrder} compact />
      <Section>
        <Container className="track-card">
          <div className="form-stack">
            <Field label="Order number" value={form.orderNumber} onChange={(event) => setForm({ ...form, orderNumber: event.target.value })} />
            <Field label="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <AppButton onClick={track}>Track Order</AppButton>
          </div>
          {error && <div className="error-card">{error}</div>}
          {result && (
            <div className="summary tracking-result">
              <h2>{result.order_number}</h2>
              <p><span>Status</span><strong>{result.order_status}</strong></p>
              <p><span>Payment</span><strong>{result.payment_status}</strong></p>
              <p><span>Total</span><strong>${result.total}</strong></p>
              <div className="status-timeline">
                {["Received", "Verified", "Prepared", "Completed"].map((item, index) => (
                  <span key={item} className={index === 0 ? "active" : ""}><FontAwesomeIcon icon={index === 0 ? faCheck : index === 1 ? faClipboardCheck : index === 2 ? faBox : faTruck} />{item}</span>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
