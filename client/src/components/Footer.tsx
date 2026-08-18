import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { getPublicSocialLinks } from "../lib/site";
import { useSiteSettings } from "../pages/hooks";
import { Container } from "./UI";

const links = {
  quick: ["Home", "Shop", "About", "Contact", "Track Order"],
  shopping: ["New Arrivals", "Featured", "Categories", "Cart"],
  care: ["Delivery & Collection Policy", "Returns / Exchange Policy", "Privacy Policy", "Terms & Conditions", "Track Order", "Admin Login"]
};

const socialIcons = {
  whatsapp: faWhatsapp,
  instagram: faInstagram,
  facebook: faFacebookF,
  tiktok: faTiktok
};

export function Footer() {
  const year = new Date().getFullYear();
  const { settings } = useSiteSettings();
  const socials = getPublicSocialLinks(settings);
  const [form, setForm] = useState({ name: "", whatsappNumber: "", optedIn: false });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitFooterSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await api.post("/stock-alerts/subscribe", form);
      setMessage(response.data.message || "You are subscribed to new stock alerts.");
      setForm({ name: "", whatsappNumber: "", optedIn: false });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "WhatsApp signup could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="footer">
      <Container className="footer__newsletter">
        <div>
          <p className="eyebrow">New arrivals</p>
          <h2>Stay close to the next drop.</h2>
          <p>Share your WhatsApp number for collection updates, restocks, and new White Angels arrivals.</p>
        </div>
        <form onSubmit={submitFooterSignup} aria-label="WhatsApp signup" className="footer-signup-form">
          <label className="sr-only" htmlFor="footer-name">Name optional</label>
          <input id="footer-name" type="text" placeholder="Your name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <label className="sr-only" htmlFor="footer-whatsapp">WhatsApp number</label>
          <input id="footer-whatsapp" type="tel" inputMode="tel" placeholder="077..." value={form.whatsappNumber} onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })} />
          <label className="footer-signup-consent">
            <input type="checkbox" checked={form.optedIn} onChange={(event) => setForm({ ...form, optedIn: event.target.checked })} />
            <span>I agree to receive White Angels WhatsApp stock updates.</span>
          </label>
          <button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Notify Me"}</button>
          {error && <div className="error-card footer-signup-message">{error}</div>}
          {message && <div className="status-banner footer-signup-message">{message}</div>}
        </form>
      </Container>
      <Container className="footer__grid">
        <div>
          <h3>{settings.shopName || "White Angels Apparels"}</h3>
          <p>Premium apparel, clean styling, flexible fulfilment, and a calm shopping experience built for confident everyday looks.</p>
          <div className="socials">
            {socials.map((item) => (
              item.enabled ? (
                <a
                  href={item.href}
                  key={item.label}
                  aria-label={item.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`social-link social-link--${item.platform}`}
                >
                  <FontAwesomeIcon icon={socialIcons[item.platform]} />
                </a>
              ) : (
                <span key={item.label} className={`socials__disabled socials__disabled--${item.platform}`} aria-label={`${item.label} not configured`}>
                  <FontAwesomeIcon icon={socialIcons[item.platform]} />
                </span>
              )
            ))}
          </div>
        </div>
        <FooterList title="Shop" items={links.shopping} />
        <FooterList title="Customer Care" items={links.care} />
        <FooterList title="Explore" items={links.quick} />
        <div>
          <h4>Contact</h4>
          {settings.phone && <p><FontAwesomeIcon icon={faPhone} /> {settings.phone}</p>}
          {settings.email && <p><FontAwesomeIcon icon={faEnvelope} /> {settings.email}</p>}
          {settings.address && <p><FontAwesomeIcon icon={faLocationDot} /> {settings.address}</p>}
          {!settings.phone && !settings.email && !settings.address && <p>Phone, email, and address stay hidden until real business details are supplied.</p>}
        </div>
        <small>&copy; {year} White Angels Apparels. All rights reserved.</small>
      </Container>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      {items.map((item) => (
        <Link key={item} to={resolveFooterLink(item)}>
          {item}
        </Link>
      ))}
    </div>
  );
}

function resolveFooterLink(item: string) {
  if (item === "Home") return "/";
  if (item === "Cart") return "/cart";
  if (item === "Track Order") return "/track-order";
  if (item === "Shop") return "/shop";
  if (item === "About") return "/about";
  if (item === "Contact") return "/contact";
  if (item === "Admin Login") return "/admin/login";
  if (item === "Terms & Conditions") return "/terms";
  if (item === "Privacy Policy") return "/privacy";
  if (item === "Delivery & Collection Policy") return "/delivery-policy";
  if (item === "Returns / Exchange Policy") return "/returns-policy";
  return "/shop";
}
