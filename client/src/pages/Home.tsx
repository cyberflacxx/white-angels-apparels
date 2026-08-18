import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faGem, faPeopleGroup, faShirt, faStore, faTruck, faWallet } from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { api } from "../lib/api";
import { resolveMediaUrl } from "../lib/media";
import { getPublicSocialLinks, WHATSAPP_CHANNEL_LABEL } from "../lib/site";
import { AppButton, AppLink, Container, EmptyState, Field, Section, SectionHeading } from "../components/UI";
import { useCatalog, useSiteSettings } from "./hooks";

const categoryPlaceholders = [
  { name: "Women", slug: "women", description: "Clean pieces for confident styling.", image_url: "/images/site/category-women.jpg" },
  { name: "Men", slug: "men", description: "Modern apparel with a polished finish.", image_url: "/images/site/category-men.jpg" },
  { name: "Shoes", slug: "shoes", description: "Strong foundations for every look.", image_url: "/images/site/category-shoes.jpg" },
  { name: "Accessories", slug: "accessories", description: "Finishing touches with intention.", image_url: "/images/site/category-accessories.jpg" }
];

const whyWhiteAngels = [
  { icon: faGem, title: "Quality Selection", copy: "Curated pieces with a polished finish for everyday confidence." },
  { icon: faTruck, title: "Reliable Delivery", copy: "Delivery options stay clear from browsing through checkout." },
  { icon: faStore, title: "Easy Collection", copy: "Collection stays simple for customers who prefer pickup." },
  { icon: faWallet, title: "Flexible Payments", copy: "EcoCash verification and cash options stay transparent." }
];

const serviceHighlights = [
  { icon: faTruck, title: "Home Delivery", copy: "Delivery is available where order details and destination information are confirmed clearly." },
  { icon: faStore, title: "Shop Collection", copy: "Pickup support stays straightforward for customers who prefer collection after confirmation." },
  { icon: faShirt, title: "Worship Ready", copy: "Polished whitewear and modest pieces prepared for worship gatherings and community events." },
  { icon: faPeopleGroup, title: "Family & Group Orders", copy: "Coordinate garments for families, groups, and shared occasion planning with practical support." }
];

export function Home() {
  const { products, categories, catalogError } = useCatalog();
  const { settings, settingsError } = useSiteSettings();
  const [stockForm, setStockForm] = useState({ name: "", whatsappNumber: "", optedIn: false });
  const [stockMessage, setStockMessage] = useState("");
  const [stockError, setStockError] = useState("");
  const [stockSubmitting, setStockSubmitting] = useState(false);
  const displayCategories = (categories.length ? categories : categoryPlaceholders.map((item, index) => ({ ...item, id: `placeholder-${index}` }))).map((category) => ({
    ...category,
    image_url: resolveMediaUrl(category.image_url) || categoryImageFallback(category.slug, settings)
  }));
  const socials = getPublicSocialLinks(settings);
  const heroBackground = resolveMediaUrl(settings.heroHomeBg) || "/images/site/hero-home-bg.jpg";
  const heroModel = resolveMediaUrl(settings.heroHomeModel) || "/images/site/hero-home-model.jpg";
  const promoBanner = resolveMediaUrl(settings.homePromoBanner) || "/images/site/banner-home-promo.jpg";
  const ecocashNumber = settings.ecocashMerchantNumber.trim();
  const ecocashMerchant = settings.ecocashMerchantName.trim() || "White Angels Apparels";

  async function submitStockAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStockMessage("");
    setStockError("");
    setStockSubmitting(true);

    try {
      const response = await api.post("/stock-alerts/subscribe", stockForm);
      setStockMessage(response.data.message || "You are subscribed to stock alerts.");
      setStockForm({ name: "", whatsappNumber: "", optedIn: false });
    } catch (requestError: any) {
      setStockError(requestError?.response?.data?.message || "Subscription could not be saved.");
    } finally {
      setStockSubmitting(false);
    }
  }

  return (
    <main>
      <section
        className="home-hero home-hero--split"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(7,26,61,.94), rgba(58,131,247,.42)), url("${heroBackground}")`
        }}
      >
        <Container className="home-hero__grid">
          <div className="home-hero__copy">
            <h1>Polished pieces for every plan.</h1>
            <p>Thoughtful fashion, confident styling, and delivery or collection options that stay easy to understand.</p>
            <div className="hero-actions">
              <AppLink to="/shop">Explore Collection</AppLink>
            </div>
          </div>
          <div className="home-hero__media">
            <div className="home-hero__media-card">
              <img src={heroModel} alt="White Angels fashion model" />
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          {(catalogError || settingsError) && <div className="status-banner" role="status">{catalogError || settingsError}</div>}
          <SectionHeading eyebrow="Shop by style" title="Featured categories" copy="Image-led category cards keep the storefront ready for real White Angels collections." action={<Link to="/shop">Browse all <FontAwesomeIcon icon={faArrowRight} /></Link>} />
          <div className="category-grid">
            {displayCategories.slice(0, 4).map((category) => (
              <Link className="category-card" key={category.id} to="/shop">
                <img loading="lazy" src={resolveMediaUrl(category.image_url) || categoryImageFallback(category.slug, settings)} alt={category.name} />
                <span>
                  <strong>{category.name}</strong>
                  <small>{category.description || "Explore the collection"}</small>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <ProductRail title="New arrivals" eyebrow="Fresh pieces" products={products.filter((product) => product.new_arrival)} empty="New arrivals will appear here once products are added." />

      <Section className="why-section">
        <Container>
          <SectionHeading eyebrow="Why White Angels" title="A cleaner way to shop apparel" copy="These signature benefits stay simple, bold, and visible across every device." />
          <div className="why-grid">
            {whyWhiteAngels.map((item) => (
              <article className="why-card" key={item.title}>
                <span className="why-card__icon" aria-hidden="true"><FontAwesomeIcon icon={item.icon} /></span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="promo-banner-section">
        <Container>
          <div className="promo-banner-card">
            <img src={promoBanner} alt="White Angels promotional banner" />
          </div>
        </Container>
      </Section>

      <ProductRail title="Featured products" eyebrow="Selected for you" products={products.filter((product) => product.featured).length ? products.filter((product) => product.featured) : products.slice(0, 4)} empty="Featured products will appear here once the catalogue is populated." />

      <Section className="split-section">
        <Container className="delivery-collection-section">
          <div className="delivery-collection-heading">
            <p className="eyebrow">Delivery and collection</p>
            <h2>Choose what works for your order.</h2>
            <p>White Angels Apparels supports practical ordering for worshipwear, family coordination, and occasion planning without making the process feel complicated.</p>
          </div>
          <div className="delivery-card-grid">
            {serviceHighlights.map((item) => (
              <Feature key={item.title} icon={item.icon} title={item.title} copy={item.title === "Shop Collection" ? (settings.collectionInstructions || item.copy) : item.copy} />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="payment-social">
          <div>
            <SectionHeading eyebrow="Payment options" title="EcoCash or cash" copy="EcoCash references are submitted for manual verification; no automatic mobile money processing is implied." />
            <div className="payment-card-grid">
              <article className="payment-method-card payment-method-card--ecocash">
                <div className="payment-method-card__brand">
                  <span className="payment-logo-badge" aria-hidden="true">EcoCash</span>
                  <div>
                    <strong>EcoCash</strong>
                    <p>{ecocashMerchant}</p>
                  </div>
                </div>
                <div className="payment-method-card__details">
                  <span>{ecocashNumber || "Merchant number can be added in Admin Settings."}</span>
                  <small>Use the configured EcoCash number above, then keep your reference ready for manual verification.</small>
                </div>
              </article>
              <div className="pill-row">
                <span><FontAwesomeIcon icon={faWallet} /> EcoCash</span>
                <span><FontAwesomeIcon icon={faStore} /> Cash</span>
              </div>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Follow White Angels" title="Social channels" copy="WhatsApp is confirmed. Facebook, TikTok, and Instagram become clickable only when configured in admin settings." />
            <div className="socials socials--large">
              {socials.map((item) => (
                item.enabled ? (
                  <a href={item.href} key={item.label} aria-label={item.label} target="_blank" rel="noopener noreferrer" className={`social-link social-link--${item.platform}`}>
                    <FontAwesomeIcon icon={item.platform === "whatsapp" ? faWhatsapp : item.platform === "facebook" ? faFacebookF : item.platform === "tiktok" ? faTiktok : faInstagram} />
                  </a>
                ) : (
                  <span key={item.label} className={`socials__disabled socials__disabled--${item.platform}`} aria-label={`${item.label} not configured`}>
                    <FontAwesomeIcon icon={item.platform === "whatsapp" ? faWhatsapp : item.platform === "facebook" ? faFacebookF : item.platform === "tiktok" ? faTiktok : faInstagram} />
                  </span>
                )
              ))}
            </div>
            <p className="social-note">{WHATSAPP_CHANNEL_LABEL} is live now. Facebook, TikTok, and Instagram can be switched on later through admin settings.</p>
          </div>
        </Container>
      </Section>

      <Section className="newsletter-block">
        <Container className="stock-alert-panel">
          <div>
            <SectionHeading eyebrow="New stock alerts" title="Get White Angels updates on WhatsApp." copy="Join the stock alert list with your WhatsApp number and explicit consent. Unsubscribed customers are excluded from sends." />
          </div>
          <form className="form-stack" onSubmit={submitStockAlert}>
            <div className="stock-alert-form-grid">
              <Field label="Name optional" value={stockForm.name} onChange={(event) => setStockForm({ ...stockForm, name: event.target.value })} placeholder="Your name" />
              <Field label="WhatsApp Number" value={stockForm.whatsappNumber} onChange={(event) => setStockForm({ ...stockForm, whatsappNumber: event.target.value })} placeholder="077..." />
              <label className="auth-checkbox stock-alert-consent">
                <input type="checkbox" checked={stockForm.optedIn} onChange={(event) => setStockForm({ ...stockForm, optedIn: event.target.checked })} />
                <span>I agree to receive White Angels Apparels stock updates through WhatsApp.</span>
              </label>
              <AppButton type="submit" disabled={stockSubmitting} className="stock-alert-submit">{stockSubmitting ? "Saving..." : "Notify Me"}</AppButton>
            </div>
            {stockError && <div className="error-card">{stockError}</div>}
            {stockMessage && <div className="status-banner">{stockMessage}</div>}
          </form>
        </Container>
      </Section>
    </main>
  );
}

function ProductRail({ title, eyebrow, products, empty }: { title: string; eyebrow: string; products: ReturnType<typeof useCatalog>["products"]; empty: string }) {
  return (
    <Section>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} action={<Link to="/shop">View shop <FontAwesomeIcon icon={faArrowRight} /></Link>} />
        {products.length ? <div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="No products yet" copy={empty} />}
      </Container>
    </Section>
  );
}

function Feature({ icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <article className="feature-card delivery-card">
      <FontAwesomeIcon icon={icon} />
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function categoryImageFallback(slug: string, settings: ReturnType<typeof useSiteSettings>["settings"]) {
  switch (slug) {
    case "women":
      return resolveMediaUrl(settings.categoryWomen) || "/images/site/category-women.jpg";
    case "men":
      return resolveMediaUrl(settings.categoryMen) || "/images/site/category-men.jpg";
    case "shoes":
      return resolveMediaUrl(settings.categoryShoes) || "/images/site/category-shoes.jpg";
    case "accessories":
      return resolveMediaUrl(settings.categoryAccessories) || "/images/site/category-accessories.jpg";
    default:
      return "/images/site/category-women.jpg";
  }
}
