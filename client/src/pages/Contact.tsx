import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Hero } from "../components/Hero";
import { AppButton, Container, Field, Section, TextAreaField } from "../components/UI";
import { useSiteSettings } from "./hooks";

export function Contact() {
  const settings = useSiteSettings();
  return (
    <main>
      <Hero title="We would love to hear from you." subtitle="Reach out for orders, collection, delivery, and product questions." image="/images/hero-contact.jpg" compact />
      <Section>
        <Container>
          <div className="contact-grid">
            <ContactCard icon={faPhone} title="Phone" value={settings.phone || "Not configured"} />
            <ContactCard icon={faEnvelope} title="Email" value={settings.email || "Not configured"} />
            <ContactCard icon={faLocationDot} title="Location" value={settings.address || "Not configured"} />
            <ContactCard icon={faWhatsapp} title="WhatsApp" value={settings.whatsapp || "Not configured"} />
          </div>
        </Container>
      </Section>
      <Section className="surface-section">
        <Container className="checkout-grid">
          <form className="form-stack" onSubmit={(event) => event.preventDefault()}>
            <h2>Send a message</h2>
            <Field label="Full name" />
            <Field label="Phone" />
            <Field label="Email" type="email" />
            <TextAreaField label="Message" />
            <AppButton type="submit" disabled>Contact Form Coming Soon</AppButton>
          </form>
          <aside className="summary">
            <h2>Store Details</h2>
            <p>Business hours, phone, email, address, and WhatsApp are pulled from site settings when configured.</p>
            {settings.whatsapp && <a className="btn btn--secondary" href={settings.whatsapp} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faWhatsapp} /> WhatsApp</a>}
          </aside>
        </Container>
      </Section>
    </main>
  );
}

function ContactCard({ icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <article className="feature-card">
      <FontAwesomeIcon icon={icon} />
      <h3>{title}</h3>
      <p>{value}</p>
    </article>
  );
}
