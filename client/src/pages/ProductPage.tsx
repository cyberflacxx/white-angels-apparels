import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Hero } from "../components/Hero";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { api, type Product } from "../lib/api";
import { useCatalog } from "./hooks";

export function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { products } = useCatalog();
  useEffect(() => {
    if (slug) void api.get<Product>(`/products/${slug}`).then((res) => setProduct(res.data));
  }, [slug]);
  if (!product) return <Hero title="Loading product" image="/images/hero-product.jpg" />;
  return (
    <main>
      <Hero title={product.name} subtitle={product.short_description} image="/images/hero-product.jpg" />
      <section className="section product-detail">
        <div className="gallery"><img src={product.image_url || "/images/hero-product.jpg"} /><img src="/images/hero-shop.jpg" /><img src="/images/hero-about.jpg" /></div>
        <div>
          <p className="eyebrow">{product.category_name} · SKU {product.sku}</p>
          <h2>{product.name}</h2>
          <div className="price">${Number(product.price).toFixed(2)} {product.previous_price && <span>${Number(product.previous_price).toFixed(2)}</span>}</div>
          <p>{product.description}</p>
          <p>{product.stock_quantity} available</p>
          <input type="number" min="1" max={product.stock_quantity} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          <button onClick={() => addItem(product, quantity)}>Add to Cart</button>
          <Link className="secondary-cta" to="/checkout" onClick={() => addItem(product, quantity)}>Buy Now</Link>
        </div>
      </section>
      <section className="section"><h2>Related Products</h2><div className="product-grid">{products.filter((item) => item.id !== product.id).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
    </main>
  );
}
