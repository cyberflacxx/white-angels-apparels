import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faCreditCard, faStore, faTruck } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Hero } from "../components/Hero";
import { ProductCard } from "../components/ProductCard";
import { AppButton, AppLink, Container, EmptyState, Field, Section, SectionHeading } from "../components/UI";
import { useCart } from "../context/CartContext";
import { api, hasApiBaseUrl, isProduct, type Product } from "../lib/api";
import { useCatalog, useSiteSettings } from "./hooks";

export function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { products } = useCatalog();
  const { settings } = useSiteSettings();

  useEffect(() => {
    let active = true;

    if (!slug) return () => {
      active = false;
    };

    setNotFound(false);
    setProduct(null);
    setLoadError("");

    if (!hasApiBaseUrl) {
      setLoadError("This product cannot be loaded because VITE_API_URL is not configured for this production build.");
      return () => {
        active = false;
      };
    }

    void api
      .get<unknown>(`/products/${slug}`)
      .then((res) => {
        if (!active) return;
        if (!isProduct(res.data)) {
          setLoadError("The product response was invalid, so the item could not be rendered.");
          return;
        }

        setProduct(res.data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loadError) {
    return (
      <main>
        <Hero title="Product unavailable" subtitle={loadError} image="/images/hero-product.jpg" compact />
        <Section><Container><EmptyState title="Product unavailable" copy="Return to the shop to browse the current catalogue." action={<AppLink to="/shop">Back to Shop</AppLink>} /></Container></Section>
      </main>
    );
  }

  if (notFound) {
    return (
      <main>
        <Hero title="Product unavailable" subtitle="This item may be sold out or no longer listed." image="/images/hero-product.jpg" compact />
        <Section><Container><EmptyState title="Product not found" copy="Return to the shop to view available items." action={<AppLink to="/shop">Back to Shop</AppLink>} /></Container></Section>
      </main>
    );
  }

  if (!product) return <Hero title="Loading product" image="/images/hero-product.jpg" compact />;

  const related = products.filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <main>
      <Hero title={product.name} subtitle={product.short_description} image={product.image_url || "/images/hero-product.jpg"} compact />
      <Section>
        <Container className="product-detail">
          <div className="gallery">
            {[product.image_url || "/images/hero-product.jpg", "/images/hero-shop.jpg", "/images/hero-about.jpg"].map((image, index) => (
              <button key={image} className={index === 0 ? "gallery__item gallery__item--main" : "gallery__item"} aria-label={`Product image ${index + 1}`}>
                <img src={image} alt={index === 0 ? product.name : ""} />
              </button>
            ))}
          </div>
          <div className="product-info">
            <p className="eyebrow">{product.category_name} / SKU {product.sku}</p>
            <h2>{product.name}</h2>
            <div className="price price--large">${Number(product.price).toFixed(2)} {product.previous_price && <span>${Number(product.previous_price).toFixed(2)}</span>}</div>
            <p>{product.description || product.short_description}</p>
            <span className={product.stock_quantity > 0 ? "stock-badge" : "stock-badge stock-badge--out"}>{product.stock_quantity > 0 ? `${product.stock_quantity} available` : "Out of stock"}</span>
            <Field label="Quantity" type="number" min="1" max={product.stock_quantity} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            <div className="product-actions">
              <AppButton icon={faCartShopping} onClick={() => addItem(product, quantity)} disabled={product.stock_quantity < 1}>Add to Cart</AppButton>
              <AppLink to="/checkout" variant="secondary" onClick={() => addItem(product, quantity)}>Buy Now</AppLink>
            </div>
            <div className="info-grid info-grid--compact">
              <MiniInfo icon={faTruck} title="Delivery" copy="Home delivery is selected during checkout." />
              <MiniInfo icon={faStore} title="Collection" copy={settings.collectionInstructions} />
              <MiniInfo icon={faCreditCard} title="Payment" copy="EcoCash verification or cash options." />
            </div>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <SectionHeading eyebrow="You may also like" title="Related products" />
          {related.length ? <div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div> : <EmptyState title="No related products yet" copy="Related items will appear after more products are added." />}
        </Container>
      </Section>
    </main>
  );
}

function MiniInfo({ icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <article className="feature-card feature-card--small">
      <FontAwesomeIcon icon={icon} />
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}
