import { MessageCircle } from "lucide-react";
import { Hero } from "../components/Hero";

export function Contact() {
  return (
    <main>
      <Hero title="Contact White Angels" subtitle="Reach out for orders, collection, delivery and product questions." image="/images/hero-contact.jpg" />
      <section className="section checkout-grid">
        <div className="form-stack"><input placeholder="Full name" /><input placeholder="Phone" /><input placeholder="Email" /><textarea placeholder="Message" /><button>Send Message</button></div>
        <aside className="summary"><h2>Store Details</h2><p>Phone, email, physical location and business hours are configurable placeholders.</p><button><MessageCircle size={16} /> WhatsApp</button></aside>
      </section>
    </main>
  );
}
