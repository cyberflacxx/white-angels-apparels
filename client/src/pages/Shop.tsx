import { useMemo, useState } from "react";
import { Hero } from "../components/Hero";
import { ProductCard } from "../components/ProductCard";
import { useCatalog } from "./hooks";

export function Shop() {
  const { products, categories } = useCatalog();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("Newest");
  const visible = useMemo(() => {
    const filtered = products.filter((product) => (!category || product.category_name === category) && product.name.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => (sort === "Price Low to High" ? Number(a.price) - Number(b.price) : sort === "Price High to Low" ? Number(b.price) - Number(a.price) : 0));
  }, [products, search, category, sort]);
  return (
    <main>
      <Hero title="Shop White Angels" subtitle="Search, filter and add your pieces to cart." image="/images/hero-shop.jpg" />
      <section className="section filters">
        <input placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All Categories</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select>
        <select><option>All Prices</option><option>$0 - $50</option><option>$50 - $100</option></select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>{["Newest", "Price Low to High", "Price High to Low", "Popular"].map((item) => <option key={item}>{item}</option>)}</select>
      </section>
      <section className="section product-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</section>
    </main>
  );
}
