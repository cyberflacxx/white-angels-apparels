import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faGem, faStore, faTruck, faWallet } from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { ProductCard } from "../components/ProductCard";
import { getPublicSocialLinks, WHATSAPP_CHANNEL_LABEL } from "../lib/site";
import { AppLink, Container, EmptyState, Section, SectionHeading } from "../components/UI";
import { useCatalog, useSiteSettings } from "./hooks";

const categoryPlaceholders = [
  { name: "Women", description: "Clean pieces for confident styling.", image_url: "/images/hero-shop.jpg" },
  { name: "Men", description: "Modern apparel with a polished finish.", image_url: "/images/hero-product.jpg" },
  { name: "Shoes", description: "Strong foundations for every look.", image_url: "/images/hero-about.jpg" },
  { name: "Accessories", description: "Finishing touches with intention.", image_url: "/images/hero-contact.jpg" }
];

export function Home() {
  const { products, categories, catalogError } = useCatalog();
  const { settings, settingsError } = useSiteSettings();
  const displayCategories = categories.length ? categories : categoryPlaceholders.map((item, index) => ({ ...item, id: `placeholder-${index}`, slug: item.name.toLowerCase() }));
  const socials = getPublicSocialLinks(settings);

  return (
    <main>
      <Hero title="Wear Your Confidence." subtitle="Curated apparel for everyday style, delivered your way." image="/images/hero-home.jpg">
        <div className="hero-actions">
          <AppLink to="/shop">Shop Collection</AppLink>
          <AppLink to="/shop" variant="ghost">Shop New Arrivals</AppLink>
        </div>
      </Hero>

      <Section>
        <Container>
          {(catalogError || settingsError) && <div className="status-banner" role="status">{catalogError || settingsError}</div>}
          <SectionHeading eyebrow="Shop by style" title="Featured categories" copy="Image-led category cards keep the storefront ready for real White Angels collections." action={<Link to="/shop">Browse all <FontAwesomeIcon icon={faArrowRight} /></Link>} />
          <div className="category-grid">
            {displayCategories.slice(0, 4).map((category) => (
              <Link className="category-card" key={category.id} to="/shop">
                <img loading="lazy" src={category.image_url || "/images/hero-shop.jpg"} alt={category.name} />
                <span>
                  <strong>{category.name}</strong>
                  <small>{category.description || "Explore the collection"}</small>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <ProductRail title="New arrivals" eyebrow="Fresh pieces" products={products.filter((p) => p.new_arrival)} empty="New arrivals will appear here once products are added." />

      <section className="promo">
        <Container>
          <p className="eyebrow">White and blue edit</p>
          <h2>Polished pieces for every plan.</h2>
          <AppLink to="/shop" variant="ghost">Explore Collection</AppLink>
        </Container>
      </section>

      <ProductRail title="Featured products" eyebrow="Selected for you" products={products.filter((p) => p.featured).length ? products.filter((p) => p.featured) : products.slice(0, 4)} empty="Featured products will appear here once the catalogue is populated." />

      <Section>
        <Container>
          <SectionHeading eyebrow="Why White Angels" title="A cleaner way to shop apparel" copy="The storefront stays practical while feeling premium, spacious, and simple to browse." />
          <div className="info-grid">
            <Feature icon={faGem} title="Quality Selection" copy="A focused catalogue structure for thoughtful merchandising." />
            <Feature icon={faTruck} title="Home Delivery" copy="Delivery details are captured clearly during checkout." />
            <Feature icon={faStore} title="Shop Collection" copy={settings.collectionInstructions || "Collection details are confirmed after order approval."} />
            <Feature icon={faWallet} title="Flexible Payments" copy="EcoCash uses manual verification; cash is available for delivery or collection." />
          </div>
        </Container>
      </Section>

      <Section className="split-section">
        <Container className="two-column">
          <div>
            <p className="eyebrow">Delivery and collection</p>
            <h2>Choose what works for your order.</h2>
          </div>
          <div className="selection-grid">
            <Feature icon={faTruck} title="Home Delivery" copy="Provide your delivery address at checkout and review the delivery fee before placing the order." />
            <Feature icon={faStore} title="Shop Collection" copy={settings.collectionInstructions || "Collection instructions are confirmed after your order is approved."} />
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="payment-social">
          <div>
            <SectionHeading eyebrow="Payment options" title="EcoCash or cash" copy="EcoCash references are submitted for manual verification; no automatic mobile money processing is implied." />
            <div className="pill-row">
              <span><FontAwesomeIcon icon={faWallet} /> EcoCash</span>
              <span><FontAwesomeIcon icon={faStore} /> Cash</span>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Follow White Angels" title="Social channels" copy="The confirmed public social channel is WhatsApp. Other channels stay hidden until real URLs are supplied." />
            <div className="socials socials--large">
              {socials.map((item) => (
                <a href={item.href} key={item.label} aria-label={item.label} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={item.platform === "whatsapp" ? faWhatsapp : item.platform === "instagram" ? faInstagram : item.platform === "facebook" ? faFacebookF : faTiktok} />
                </a>
              ))}
            </div>
            <p className="social-note">{WHATSAPP_CHANNEL_LABEL} is live now. Facebook, Instagram, and TikTok will appear automatically when their real URLs are configured.</p>
          </div>
        </Container>
      </Section>

      <Section className="newsletter-block">
        <Container>
          <SectionHeading eyebrow="Newsletter" title="New drop alerts are coming soon." copy="The form is intentionally disabled until a subscription backend exists." />
          <form onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" type="email" placeholder="Email address" disabled />
            <button disabled>Subscribe Soon</button>
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
    <article className="feature-card">
      <FontAwesomeIcon icon={icon} />
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}
