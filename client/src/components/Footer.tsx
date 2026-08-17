import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../pages/hooks";
import { Container } from "./UI";

const links = {
  quick: ["Home", "Shop", "About", "Contact", "Track Order"],
  shopping: ["New Arrivals", "Featured", "Categories", "Cart"],
  care: ["Delivery", "Collection", "Payment Information", "Track Order", "Returns", "Privacy", "Terms"]
};

export function Footer() {
  const year = new Date().getFullYear();
  const settings = useSiteSettings();
  const socials = [
    { href: settings.instagram, icon: faInstagram, label: "Instagram" },
    { href: settings.facebook, icon: faFacebookF, label: "Facebook" },
    { href: settings.tiktok, icon: faTiktok, label: "TikTok" },
    { href: settings.whatsapp, icon: faWhatsapp, label: "WhatsApp" }
  ].filter((item) => item.href);

  return (
    <footer className="footer">
      <Container className="footer__newsletter">
        <div>
          <p className="eyebrow">New arrivals</p>
          <h2>Stay close to the next drop.</h2>
        </div>
        <form onSubmit={(event) => event.preventDefault()} aria-label="Newsletter signup">
          <label className="sr-only" htmlFor="footer-email">Email address</label>
          <input id="footer-email" type="email" placeholder="Email address" disabled />
          <button type="submit" disabled>Coming Soon</button>
        </form>
      </Container>
      <Container className="footer__grid">
        <div>
          <h3>{settings.shopName || "White Angels Apparels"}</h3>
          <p>Premium apparel, clean styling, flexible fulfilment, and a calm shopping experience built for confident everyday looks.</p>
          {socials.length > 0 && (
            <div className="socials">
              {socials.map((item) => (
                <a href={item.href} key={item.label} aria-label={item.label} target="_blank" rel="noreferrer">
                  <FontAwesomeIcon icon={item.icon} />
                </a>
              ))}
            </div>
          )}
        </div>
        <FooterList title="Shop" items={links.shopping} />
        <FooterList title="Help" items={links.care} />
        <FooterList title="Explore" items={links.quick} />
        <div>
          <h4>Contact</h4>
          {settings.phone && <p><FontAwesomeIcon icon={faPhone} /> {settings.phone}</p>}
          {settings.email && <p><FontAwesomeIcon icon={faEnvelope} /> {settings.email}</p>}
          {settings.address && <p><FontAwesomeIcon icon={faLocationDot} /> {settings.address}</p>}
          {!settings.phone && !settings.email && !settings.address && <p>Phone, email, address, and WhatsApp are managed in site settings.</p>}
        </div>
        <small>© {year} White Angels Apparels. All rights reserved.</small>
      </Container>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      {items.map((item) => (
        <Link key={item} to={item === "Home" ? "/" : item === "Cart" ? "/cart" : item === "Track Order" ? "/track-order" : item === "Shop" ? "/shop" : item === "About" ? "/about" : item === "Contact" ? "/contact" : "/shop"}>
          {item}
        </Link>
      ))}
    </div>
  );
}
