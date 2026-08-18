import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useState } from "react";
import { Hero } from "../components/Hero";
import { AppButton, Container, Field, Section, TextAreaField } from "../components/UI";
import { WHATSAPP_CHANNEL_LABEL, WHATSAPP_CHANNEL_URL } from "../lib/site";
import { buildCustomerEnquiryMessage, buildWhatsappChatUrl, getBusinessWhatsappDisplayNumber } from "../lib/whatsapp";
import { useSiteSettings } from "./hooks";

export function Contact() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", subject: "", message: "" });
  const [error, setError] = useState("");

  function openWhatsapp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = buildCustomerEnquiryMessage({
      name: form.fullName,
      phone: form.phone,
      email: form.email,
      subject: form.subject,
      message: form.message
    });

    const href = buildWhatsappChatUrl(message);
    if (!href) {
      setError("Add your name, phone number, and message before opening WhatsApp.");
      return;
    }

    setError("");
    window.open(href, "_blank", "noopener,noreferrer");
  }

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
          <form className="form-stack" onSubmit={openWhatsapp}>
            <h2>Send a message</h2>
            <div className="form-grid">
              <Field label="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
              <Field label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
              <Field label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <Field label="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </div>
            <TextAreaField label="Message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
            {error && <div className="error-card">{error}</div>}
            <AppButton type="submit" icon={faWhatsapp}>Message on WhatsApp</AppButton>
          </form>
          <aside className="summary">
            <h2>Store Details</h2>
            <p>Business hours, phone, email, and address stay hidden until real business details are supplied. For direct enquiries, White Angels can be reached on WhatsApp at {getBusinessWhatsappDisplayNumber()}.</p>
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
