import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { ProductCard } from "../components/ProductCard";
import { useCatalog } from "./hooks";

export function Home() {
  const { products, categories } = useCatalog();
  return (
    <main>
      <Hero title="Premium fashion with a clean, confident edge" subtitle="Curated apparel for everyday polish, occasions and statement styling." image="/images/hero-home.jpg">
        <Link className="primary-cta" to="/shop">Shop Now</Link>
      </Hero>
      <section className="section intro">
        <h2>White Angels Apparels</h2>
        <p>A fashion-store experience built around strong pieces, clean presentation and practical order fulfilment for delivery or collection.</p>
      </section>
      <section className="section">
        <div className="section-head"><h2>Featured Categories</h2><Link to="/shop">Browse all</Link></div>
        <div className="category-grid">{categories.map((category) => <article key={category.id}><img src={category.image_url || "/images/hero-shop.jpg"} /><h3>{category.name}</h3><p>{category.description}</p></article>)}</div>
      </section>
      <ProductRail title="Featured Products" products={products.filter((p) => p.featured)} />
      <ProductRail title="New Arrivals" products={products.filter((p) => p.new_arrival)} />
      <ProductRail title="Best Sellers" products={products.slice(0, 4)} />
      <section className="promo"><h2>Polished pieces for every plan</h2><Link to="/shop">Explore Collection</Link></section>
      <section className="section info-grid">{["Quality-led selection", "Delivery and collection support", "Manual EcoCash verification", "Order tracking with phone match"].map((text) => <div key={text}><h3>{text}</h3><p>Prepared as configurable production foundations for the first version.</p></div>)}</section>
      <section className="section newsletter"><h2>Stay Close To New Drops</h2><form><input placeholder="Email address" /><button>Notify Me</button></form></section>
    </main>
  );
}

function ProductRail({ title, products }: { title: string; products: ReturnType<typeof useCatalog>["products"] }) {
  return <section className="section"><div className="section-head"><h2>{title}</h2></div><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>;
}
