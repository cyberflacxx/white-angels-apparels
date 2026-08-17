import { Eye, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import type { Product } from "../lib/api";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  return (
    <article className="product-card">
      <img src={product.image_url || "/images/hero-product.jpg"} alt={product.name} />
      <div>
        <p>{product.category_name}</p>
        <h3>{product.name}</h3>
        <div className="price">
          ${Number(product.price).toFixed(2)} {product.previous_price && <span>${Number(product.previous_price).toFixed(2)}</span>}
        </div>
        <small>{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}</small>
      </div>
      <div className="card-actions">
        <button onClick={() => addItem(product)} disabled={product.stock_quantity < 1}>
          <ShoppingBag size={16} /> Add
        </button>
        <Link to={`/product/${product.slug}`}>
          <Eye size={16} /> View
        </Link>
      </div>
    </article>
  );
}
