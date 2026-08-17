import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faMagnifyingGlass, faSliders } from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
import { Hero } from "../components/Hero";
import { ProductCard } from "../components/ProductCard";
import { Container, EmptyState, Section, SelectField } from "../components/UI";
import { useCatalog } from "./hooks";

export function Shop() {
  const { products, categories } = useCatalog();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("Newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const visible = useMemo(() => {
    const filtered = products.filter((product) => (!category || product.category_name === category) && product.name.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => (sort === "Price Low to High" ? Number(a.price) - Number(b.price) : sort === "Price High to Low" ? Number(b.price) - Number(a.price) : 0));
  }, [products, search, category, sort]);

  return (
    <main>
      <Hero title="Find your next look." subtitle="Search, filter, and shop White Angels pieces without clutter." image="/images/hero-shop.jpg" compact />
      <Section>
        <Container>
          <div className="breadcrumb">Home / Shop</div>
          <div className="shop-heading">
            <div>
              <p className="eyebrow">Shop</p>
              <h2>{visible.length} {visible.length === 1 ? "product" : "products"}</h2>
            </div>
            <button className="btn btn--secondary mobile-filter-button" onClick={() => setFiltersOpen(true)}>
              <FontAwesomeIcon icon={faSliders} /> Filters
            </button>
          </div>

          <div className={filtersOpen ? "filters filters--open" : "filters"}>
            <button className="filters__close mobile-only" onClick={() => setFiltersOpen(false)} aria-label="Close filters">Close</button>
            <label className="field search-field">
              <span>Search products</span>
              <span>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <input placeholder="Dress, blazer, scarf..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </span>
            </label>
            <SelectField label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All Categories</option>
              {categories.map((item) => <option key={item.id}>{item.name}</option>)}
            </SelectField>
            <SelectField label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              {["Newest", "Price Low to High", "Price High to Low", "Popular"].map((item) => <option key={item}>{item}</option>)}
            </SelectField>
            <button className="btn btn--soft" onClick={() => { setSearch(""); setCategory(""); setSort("Newest"); }}>
              <FontAwesomeIcon icon={faFilter} /> Reset
            </button>
          </div>

          {visible.length ? <div className="product-grid shop-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="No products found" copy="Try a different search or category. New products will appear here after the catalogue is populated." />}
        </Container>
      </Section>
    </main>
  );
}
