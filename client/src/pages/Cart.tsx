import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { AppLink, Container, EmptyState, Field, Section } from "../components/UI";
import { useCart } from "../context/CartContext";
import { resolveMediaUrl } from "../lib/media";
import { useSiteSettings } from "./hooks";

export function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const { settings } = useSiteSettings();
  return (
    <main>
      <Hero className="hero--cart" title="Your Cart" subtitle="Review your pieces before checkout." image={settings.heroCart} compact />
      <Section>
        <Container className="cart-layout">
          <div className="cart-list">
            {items.length ? items.map(({ product, quantity }) => (
              <article className="cart-row" key={product.id}>
                <img src={resolveMediaUrl(product.image_url) || "/images/site/placeholder-product.jpg"} alt={product.name} />
                <div>
                  <Link to={`/product/${product.slug}`}>{product.name}</Link>
                  <small>{product.category_name}</small>
                </div>
                <strong>${Number(product.price).toFixed(2)}</strong>
                <Field aria-label={`Quantity for ${product.name}`} label="Qty" type="number" min="1" max={product.stock_quantity} value={quantity} onChange={(event) => updateQuantity(product.id, Number(event.target.value))} />
                <button className="icon-button icon-button--danger" onClick={() => removeItem(product.id)} aria-label={`Remove ${product.name}`}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </article>
            )) : <EmptyState icon={faCartShopping} title="Your cart is empty" copy="Start with the shop collection and add your first piece." action={<AppLink to="/shop">Shop Now</AppLink>} />}
          </div>
          <aside className="summary">
            <h2>Order Summary</h2>
            <p><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></p>
            <p><span>Delivery</span><strong>Calculated at checkout</strong></p>
            <p className="summary__total"><span>Total</span><strong>${subtotal.toFixed(2)}+</strong></p>
            <AppLink to="/checkout" className={items.length ? "" : "disabled-link"}>Checkout</AppLink>
          </aside>
        </Container>
      </Section>
    </main>
  );
}
