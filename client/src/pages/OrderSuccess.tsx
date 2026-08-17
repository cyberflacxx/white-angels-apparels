import { faBox } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";
import { Hero } from "../components/Hero";
import { AppLink, Container, EmptyState, Section } from "../components/UI";

export function OrderSuccess() {
  const { orderNumber } = useParams();
  return (
    <main>
      <Hero title="Order Received" subtitle={`Your order number is ${orderNumber}.`} image="/images/site/hero-checkout.jpg" compact />
      <Section>
        <Container className="track-card">
          <EmptyState icon={faBox} title="Thank you for shopping White Angels Apparels" copy="Payment status, fulfilment method, purchased items, and current order status are stored on your order record." action={<AppLink to="/track-order">Track Order</AppLink>} />
        </Container>
      </Section>
    </main>
  );
}
