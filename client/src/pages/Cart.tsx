import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { useCart } from "../context/CartContext";

export function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  return (
    <main>
      <Hero title="Your Cart" subtitle="Review quantities before checkout." image="/images/hero-cart.jpg" />
      <section className="section cart-layout">
        <div>{items.map(({ product, quantity }) => <article className="cart-row" key={product.id}><img src={product.image_url || "/images/hero-product.jpg"} /><strong>{product.name}</strong><span>${product.price}</span><input type="number" min="1" max={product.stock_quantity} value={quantity} onChange={(event) => updateQuantity(product.id, Number(event.target.value))} /><button onClick={() => removeItem(product.id)}>Remove</button></article>)}</div>
        <aside className="summary"><h2>Cart Summary</h2><p>Subtotal: ${subtotal.toFixed(2)}</p><p>Delivery is calculated by fulfilment method during checkout.</p><Link className="primary-cta" to="/checkout">Checkout</Link></aside>
      </section>
    </main>
  );
}
