import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Hero } from "../components/Hero";
import { AppButton, Container, Field, Section, TextAreaField } from "../components/UI";
import { WHATSAPP_CHANNEL_LABEL, WHATSAPP_CHANNEL_URL } from "../lib/site";
import { useSiteSettings } from "./hooks";

export function Contact() {
  const { settings } = useSiteSettings();
  return (
    <main>
      <Hero className="hero--contact" title="We would love to hear from you." subtitle="Reach out for orders, collection, delivery, and product questions." image={settings.heroContact} compact />
      <Section>
        <Container>
          <div className="contact-grid">
            <ContactCard icon={faPhone} title="Phone" value={settings.phone || "Not configured"} />
            <ContactCard icon={faEnvelope} title="Email" value={settings.email || "Not configured"} />
            <ContactCard icon={faLocationDot} title="Location" value={settings.address || "Not configured"} />
            <ContactCard icon={faWhatsapp} title={WHATSAPP_CHANNEL_LABEL} value="Join the official White Angels WhatsApp Channel." href={settings.whatsapp || WHATSAPP_CHANNEL_URL} />
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
            <p>Business hours, phone, email, and address stay hidden until real business details are supplied. The confirmed public social channel is WhatsApp.</p>
            <a className="btn btn--secondary" href={settings.whatsapp || WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faWhatsapp} /> {WHATSAPP_CHANNEL_LABEL}</a>
          </aside>
        </Container>
      </Section>
    </main>
  );
}

function ContactCard({ icon, title, value, href }: { icon: any; title: string; value: string; href?: string }) {
  return (
    <article className="feature-card">
      <FontAwesomeIcon icon={icon} />
      <h3>{title}</h3>
      {href ? <a className="contact-link" href={href} target="_blank" rel="noopener noreferrer">{value}</a> : <p>{value}</p>}
    </article>
  );
}
