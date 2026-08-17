import { Link, useParams } from "react-router-dom";
import { Hero } from "../components/Hero";

export function OrderSuccess() {
  const { orderNumber } = useParams();
  return (
    <main>
      <Hero title="Order Received" subtitle={`Your order number is ${orderNumber}.`} image="/images/hero-checkout.jpg" />
      <section className="section summary">
        <h2>Thank you for shopping White Angels Apparels</h2>
        <p>Payment status, fulfilment method, purchased items and current order status are stored by the backend order record.</p>
        <Link className="primary-cta" to="/track-order">Track Order</Link>
      </section>
    </main>
  );
}
