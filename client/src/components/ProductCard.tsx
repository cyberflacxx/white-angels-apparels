import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faEye } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import type { Product } from "../lib/api";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  return (
    <article className="product-card">
      <Link className="product-card__media" to={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
        <img loading="lazy" src={product.image_url || "/images/hero-product.jpg"} alt={product.name} />
      </Link>
      <div className="product-card__body">
        <p className="product-card__category">{product.category_name || "Collection"}</p>
        <h3>{product.name}</h3>
        <div className="price">
          ${Number(product.price).toFixed(2)} {product.previous_price && <span>${Number(product.previous_price).toFixed(2)}</span>}
        </div>
        <small className={product.stock_quantity > 0 ? "stock-badge" : "stock-badge stock-badge--out"}>{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}</small>
      </div>
      <div className="card-actions">
        <button onClick={() => addItem(product)} disabled={product.stock_quantity < 1}>
          <FontAwesomeIcon icon={faCartShopping} /> Add
        </button>
        <Link to={`/product/${product.slug}`}>
          <FontAwesomeIcon icon={faEye} /> View
        </Link>
      </div>
    </article>
  );
}
