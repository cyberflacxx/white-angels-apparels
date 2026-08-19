import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faBox,
  faBoxesStacked,
  faChartLine,
  faCloudArrowUp,
  faDollarSign,
  faFloppyDisk,
  faLayerGroup,
  faMoneyBillWave,
  faPaperPlane,
  faPenToSquare,
  faPlus,
  faShoppingCart,
  faStore,
  faTrashCan,
  faTriangleExclamation,
  faUsers,
  faUserCheck
} from "@fortawesome/free-solid-svg-icons";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from "chart.js";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AppButton, EmptyState, Field, LoadingButtonLabel, SelectField, TextAreaField } from "../components/UI";
import { api, extractApiError, type Category, type Product, type ProductImage, type SiteSettings } from "../lib/api";
import { resolveMediaUrl, toStoredSiteSettingsMedia } from "../lib/media";
import { normalizeSiteSettings, useAdminAccount, useAdminDashboard, useSiteSettings, useSubscribers } from "./hooks";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const mediaSlots = [
  { label: "Logo", slot: "logo", key: "logoUrl" },
  { label: "Home Background", slot: "homeBackground", key: "heroHomeBg" },
  { label: "Home Model Image", slot: "homeModel", key: "heroHomeModel" },
  { label: "Shop Hero", slot: "shopHero", key: "heroShop" },
  { label: "About Hero", slot: "aboutHero", key: "heroAbout" },
  { label: "Contact Hero", slot: "contactHero", key: "heroContact" },
  { label: "Cart Hero", slot: "cartHero", key: "heroCart" },
  { label: "Checkout Hero", slot: "checkoutHero", key: "heroCheckout" },
  { label: "Track Order Hero", slot: "trackOrderHero", key: "heroTrackOrder" },
  { label: "Product Hero", slot: "productHero", key: "heroProduct" },
  { label: "Admin Login Background", slot: "adminLoginHero", key: "heroAdminLogin" },
  { label: "Home Promo Banner", slot: "homePromoBanner", key: "homePromoBanner" },
  { label: "Category Women", slot: "categoryWomen", key: "categoryWomen" },
  { label: "Category Men", slot: "categoryMen", key: "categoryMen" },
  { label: "Category Shoes", slot: "categoryShoes", key: "categoryShoes" },
  { label: "Category Accessories", slot: "categoryAccessories", key: "categoryAccessories" }
] as const;

const emptyProductForm = {
  name: "",
  slug: "",
  sku: "",
  price: "",
  previousPrice: "",
  stockQuantity: "0",
  lowStockThreshold: "5",
  categoryId: "",
  shortDescription: "",
  description: "",
  status: "ACTIVE" as const,
  featured: false,
  newArrival: false
};

type ProductFormState = typeof emptyProductForm;
type ProductFormErrors = Partial<Record<keyof ProductFormState | "form", string>>;

export function AdminDashboard() {
  const { account } = useAdminAccount();
  const { dashboard, loading, error } = useAdminDashboard();
  const isDark = typeof document !== "undefined" && document.documentElement.dataset.adminTheme === "dark";
  const axisColor = isDark ? "#C7D2E5" : "#64748B";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(148, 163, 184, 0.22)";
  const tooltipBackground = isDark ? "#172033" : "#FFFFFF";
  const tooltipText = isDark ? "#E2E8F0" : "#0F172A";
  const cards = dashboard ? [
    { label: "Today's Revenue", value: formatMoney(dashboard.cards.todaysSales), icon: faDollarSign, tone: "success" },
    { label: "All Orders", value: String(dashboard.cards.totalOrders), icon: faShoppingCart, tone: "primary" },
    { label: "Pending Orders", value: String(dashboard.cards.pendingOrders), icon: faChartLine, tone: "warning" },
    { label: "Awaiting EcoCash Review", value: String(dashboard.cards.awaitingPaymentVerification), icon: faMoneyBillWave, tone: "teal" },
    { label: "Low Stock", value: String(dashboard.cards.lowStockProducts), icon: faTriangleExclamation, tone: "danger" },
    { label: "Subscribers", value: String(dashboard.cards.totalSubscribers), icon: faUsers, tone: "accent" }
  ] : [];
  const chartData = {
    labels: dashboard?.salesOverview.map((item) => item.day) ?? [],
    datasets: [
      {
        label: "Revenue",
        data: dashboard?.salesOverview.map((item) => item.revenue) ?? [],
        backgroundColor: "#3A83F7",
        borderRadius: 10,
        maxBarThickness: 40
      }
    ]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Last 7 Days Revenue" },
      tooltip: {
        backgroundColor: tooltipBackground,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        callbacks: {
          label(context: { parsed: { y: number } }) {
            return `Revenue ${formatMoney(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: { ticks: { color: axisColor }, grid: { display: false } },
      y: { ticks: { color: axisColor }, grid: { color: gridColor } }
    }
  };

  return (
    <section className="admin-page">
      <AdminHeader title={`Welcome, ${account?.first_name || "Admin"}`} copy="Operational overview for White Angels Apparels." />
      {error && <div className="error-card">{error}</div>}
      {loading ? <div className="status-banner">Loading dashboard analytics...</div> : null}
      <div className="metric-grid">
        {cards.map((card) => (
          <article key={card.label} className={`metric-card metric-card--${card.tone}`}>
            <FontAwesomeIcon icon={card.icon} />
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>
      <div className="admin-grid">
        <div className="admin-panel admin-panel--chart">
          <h2>Sales overview</h2>
          {dashboard?.salesOverview.length ? (
            <div className="admin-chart-wrap">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <EmptyState title="No sales data yet" copy="Revenue bars will appear here after real orders are created." />
          )}
        </div>
        <div className="admin-panel">
          <h2>Recent orders</h2>
          {dashboard?.recentOrders.length ? (
            <div className="admin-list">
              {dashboard.recentOrders.map((order) => (
                <article className="admin-list-item" key={order.id}>
                  <div>
                    <strong>{order.order_number}</strong>
                    <span>{order.full_name}</span>
                  </div>
                  <div>
                    <strong>{formatMoney(Number(order.total))}</strong>
                    <span>{formatStatus(order.order_status)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : <EmptyState title="No orders yet" copy="Order activity appears here after customers begin checking out." />}
        </div>
      </div>
      <div className="admin-grid admin-grid--compact">
        <div className="admin-panel">
          <h2>Stock watch</h2>
          {dashboard?.lowStock.length ? (
            <div className="admin-list">
              {dashboard.lowStock.map((item) => (
                <article className="admin-list-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>Threshold {item.low_stock_threshold}</span>
                  </div>
                  <div>
                    <strong>{item.stock_quantity}</strong>
                    <span>remaining</span>
                  </div>
                </article>
              ))}
            </div>
          ) : <EmptyState title="Stock levels look healthy" copy="Low-stock alerts will appear here when products approach their threshold." />}
        </div>
        <div className="admin-panel">
          <h2>Service mix</h2>
          <div className="admin-stat-pills">
            <span className="admin-stat-pill admin-stat-pill--primary"><FontAwesomeIcon icon={faStore} /> {dashboard?.cards.shopCollections ?? 0} collections</span>
            <span className="admin-stat-pill admin-stat-pill--success"><FontAwesomeIcon icon={faArrowTrendUp} /> {dashboard?.cards.homeDeliveries ?? 0} deliveries</span>
            <span className="admin-stat-pill admin-stat-pill--accent"><FontAwesomeIcon icon={faBoxesStacked} /> {dashboard?.cards.totalProducts ?? 0} active products</span>
            <span className="admin-stat-pill admin-stat-pill--warning"><FontAwesomeIcon icon={faUsers} /> {dashboard?.cards.customers ?? 0} customers</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminOrders() {
  return <AdminTable title="Orders" emptyTitle="No orders yet" columns={["Order number", "Customer", "Phone", "Amount", "Payment", "Fulfilment", "Status", "Created", "Actions"]} filters={["All", "Pending", "Paid", "EcoCash", "Cash", "Home Delivery", "Shop Collection", "Completed", "Cancelled"]} />;
}

export function AdminOrderDetail() {
  return (
    <section className="admin-page">
      <AdminHeader title="Order Detail" copy="Customer, payment, fulfilment, and order action foundation." />
      <div className="admin-panel action-panel">
        <EmptyState icon={faBox} title="Select a real order" copy="Order details will populate after database-backed admin list integration." />
        {["Verify Payment", "Reject Payment", "Confirm Order", "Mark Preparing", "Ready for Collection", "Out for Delivery", "Delivered", "Collected", "Cancel Order"].map((item) => <button key={item}>{item}</button>)}
      </div>
    </section>
  );
}

export function AdminProducts() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message] = useState(readFlashMessage(location.state));

  useEffect(() => {
    if (!location.state || !readFlashMessage(location.state)) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    void api.get<Product[]>("/admin/products")
      .then((response) => {
        if (!active) return;
        setProducts(response.data);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(extractApiError(requestError, "Products could not be loaded.").message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-header admin-header--row">
        <div><h1>Products</h1><p>Add products, edit details, manage images, change prices, update stock, and deactivate items from one place.</p></div>
        <Link className="btn btn--primary" to="/admin/products/new"><FontAwesomeIcon icon={faPlus} /> Add Product</Link>
      </div>
      {message ? <div className="status-banner">{message}</div> : null}
      {error ? <div className="error-card">{error}</div> : null}
      <div className="admin-panel table-wrap">
        {loading ? <div className="status-banner">Loading products...</div> : (
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length ? products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img
                      className="admin-product-thumb"
                      src={resolveMediaUrl(product.image_url) || "/images/site/placeholder-product.jpg"}
                      alt={product.name}
                    />
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    <div className="table-subtle">{product.slug}</div>
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.category_name}</td>
                  <td>{formatMoney(Number(product.price))}</td>
                  <td>{product.stock_quantity}</td>
                  <td>{formatStatus(product.status || "ACTIVE")}</td>
                  <td>{product.featured ? "Yes" : "No"}</td>
                  <td className="table-actions">
                    <Link className="btn btn--secondary" to={`/admin/products/${product.id}/edit`}>
                      <FontAwesomeIcon icon={faPenToSquare} /> Edit
                    </Link>
                  </td>
                </tr>
              )) : <tr><td colSpan={9}><EmptyInline icon={faBox} title="No products yet" /></td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export function ProductForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message] = useState(readFlashMessage(location.state));
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!location.state || !readFlashMessage(location.state)) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSubmitError("");

    void Promise.all([
      api.get<Category[]>("/admin/categories"),
      isEditing ? api.get<Product>(`/admin/products/${id}`) : Promise.resolve(null)
    ])
      .then(([categoriesResponse, productResponse]) => {
        if (!active) return;
        setCategories(categoriesResponse.data);

        if (productResponse?.data) {
          const product = productResponse.data;
          setForm({
            name: product.name ?? "",
            slug: product.slug ?? "",
            sku: product.sku ?? "",
            price: normalizeDecimal(product.price),
            previousPrice: normalizeOptionalDecimal(product.previous_price),
            stockQuantity: String(product.stock_quantity ?? 0),
            lowStockThreshold: String(product.low_stock_threshold ?? 0),
            categoryId: product.category_id ?? "",
            shortDescription: product.short_description ?? "",
            description: product.description ?? "",
            status: product.status ?? "ACTIVE",
            featured: Boolean(product.featured),
            newArrival: Boolean(product.new_arrival)
          });
          setExistingImages(Array.isArray(product.images) ? product.images : []);
          setSlugEdited(true);
        } else {
          setForm(emptyProductForm);
          setExistingImages([]);
          setSlugEdited(false);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setSubmitError(extractApiError(requestError, "Product form could not be loaded.").message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEditing]);

  useEffect(() => {
    if (slugEdited) return;
    setForm((current) => ({ ...current, slug: slugify(current.name) }));
  }, [form.name, slugEdited]);

  function updateField<Key extends keyof ProductFormState>(key: Key, value: ProductFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    setSubmitError("");
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(event.target.files ?? []));
    setFieldErrors((current) => ({ ...current, form: undefined }));
  }

  async function saveProduct() {
    const nextErrors = validateProductForm(form);
    setFieldErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) return;

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("slug", slugify(form.slug || form.name));
    payload.append("sku", form.sku.trim());
    payload.append("categoryId", form.categoryId);
    payload.append("shortDescription", form.shortDescription.trim());
    payload.append("description", form.description.trim());
    payload.append("price", String(Number(form.price)));
    payload.append("previousPrice", form.previousPrice.trim());
    payload.append("stockQuantity", String(Number(form.stockQuantity)));
    payload.append("lowStockThreshold", String(Number(form.lowStockThreshold)));
    payload.append("status", form.status);
    payload.append("featured", String(form.featured));
    payload.append("newArrival", String(form.newArrival));
    payload.append("imageOrder", JSON.stringify(existingImages.map((image) => image.id)));
    payload.append("deletedImageIds", JSON.stringify([]));

    for (const file of selectedFiles) {
      payload.append("images", file);
    }

    setSaving(true);

    try {
      await (isEditing ? api.put(`/admin/products/${id}`, payload) : api.post("/admin/products", payload));
      navigate("/admin/products", {
        replace: true,
        state: { message: "Product saved successfully." }
      });
    } catch (requestError) {
      const summary = extractApiError(requestError, "Product could not be saved. Please try again.");
      setFieldErrors((current) => ({ ...current, ...summary.fieldErrors }));
      setSubmitError(summary.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrentProduct() {
    if (!isEditing || !id || deleting || saving) return;
    const confirmed = window.confirm("Are you sure you want to delete this product?\nThis action cannot be undone.");
    if (!confirmed) return;

    setSubmitError("");
    setFieldErrors({});
    setDeleting(true);

    try {
      await api.delete(`/admin/products/${id}`);
      navigate("/admin/products", {
        replace: true,
        state: { message: "Product deleted successfully." }
      });
    } catch (requestError) {
      const summary = extractApiError(requestError, "Product could not be deleted. Please try again.");
      setSubmitError(summary.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="admin-page">
      <AdminHeader title={isEditing ? "Edit Product" : "Add Product"} copy="Add product details, upload a main image, add extra images, and save products with inventory-safe validation." />
      <div className="admin-panel form-stack">
        {loading ? <div className="status-banner">Loading product form...</div> : (
          <>
            {submitError ? (
              <div className="error-card" role="alert">
                <strong>Could not save product</strong>
                <p>{submitError}</p>
              </div>
            ) : null}
            {message ? <div className="status-banner">{message}</div> : null}
            <div className="form-grid">
              <Field label="Name" value={form.name} error={fieldErrors.name} onChange={(event) => updateField("name", event.target.value)} />
              <Field
                label="Slug"
                value={form.slug}
                error={fieldErrors.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  updateField("slug", slugify(event.target.value));
                }}
              />
              <Field label="SKU" value={form.sku} error={fieldErrors.sku} onChange={(event) => updateField("sku", event.target.value)} />
              <Field label="Price" type="number" min="0" step="0.01" value={form.price} error={fieldErrors.price} onChange={(event) => updateField("price", event.target.value)} />
              <Field label="Previous price" type="number" min="0" step="0.01" value={form.previousPrice} error={fieldErrors.previousPrice} onChange={(event) => updateField("previousPrice", event.target.value)} />
              <Field label="Stock" type="number" min="0" step="1" value={form.stockQuantity} error={fieldErrors.stockQuantity} onChange={(event) => updateField("stockQuantity", event.target.value)} />
              <Field label="Low-stock threshold" type="number" min="0" step="1" value={form.lowStockThreshold} error={fieldErrors.lowStockThreshold} onChange={(event) => updateField("lowStockThreshold", event.target.value)} />
              <SelectField label="Category" value={form.categoryId} error={fieldErrors.categoryId} onChange={(event) => updateField("categoryId", event.target.value)}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </SelectField>
              <SelectField label="Status" value={form.status} onChange={(event) => updateField("status", event.target.value as ProductFormState["status"])}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </SelectField>
              <Field label="Short description" value={form.shortDescription} onChange={(event) => updateField("shortDescription", event.target.value)} />
              <label className="field">
                <span className="field__label">Featured</span>
                <input type="checkbox" checked={form.featured} onChange={(event) => updateField("featured", event.target.checked)} />
              </label>
              <label className="field">
                <span className="field__label">New arrival</span>
                <input type="checkbox" checked={form.newArrival} onChange={(event) => updateField("newArrival", event.target.checked)} />
              </label>
            </div>
            <TextAreaField label="Description" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
            <label className="upload-zone">
              <FontAwesomeIcon icon={faCloudArrowUp} />
              <strong>Upload Product Images</strong>
              <span>Select a main image or extra gallery images. Existing images stay in place if saving fails.</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleFileSelection} />
            </label>
            {selectedFiles.length ? (
              <div className="admin-file-list">
                {selectedFiles.map((file) => <span key={file.name}>{file.name}</span>)}
              </div>
            ) : null}
            {existingImages.length ? (
              <div className="admin-image-strip">
                {existingImages.map((image) => (
                  <img key={image.id} src={resolveMediaUrl(image.image_url) || "/images/site/placeholder-product.jpg"} alt="Product" />
                ))}
              </div>
            ) : null}
            <div className="admin-form-actions">
              <AppButton
                type="button"
                variant="success"
                icon={saving ? null : faFloppyDisk}
                disabled={saving || deleting}
                onClick={() => void saveProduct()}
              >
                {saving ? <LoadingButtonLabel label="Saving..." /> : isEditing ? "Save Changes" : "Save Product"}
              </AppButton>
              {isEditing ? (
                <AppButton
                  type="button"
                  variant="danger"
                  icon={deleting ? null : faTrashCan}
                  className="admin-delete-product"
                  disabled={saving || deleting}
                  onClick={() => void deleteCurrentProduct()}
                >
                  {deleting ? <LoadingButtonLabel label="Deleting..." /> : "Delete Product"}
                </AppButton>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function AdminCategories() {
  return <AdminTable title="Categories" emptyTitle="No categories yet" columns={["Name", "Slug", "Status", "Created", "Actions"]} icon={faLayerGroup} />;
}

export function AdminInventory() {
  return (
    <section className="admin-page">
      <AdminHeader title="Inventory" copy="Record stock movement adjustments when backend actions are connected." />
      <div className="admin-panel form-stack">
        <div className="form-grid">
          <SelectField label="Product"><option>Select product</option></SelectField>
          <SelectField label="Movement type"><option>STOCK_IN</option><option>SALE</option><option>ADJUSTMENT</option><option>RETURN</option><option>DAMAGED</option></SelectField>
          <Field label="Quantity" />
          <Field label="Reason" />
        </div>
        <TextAreaField label="Notes" />
        <AppButton>Record Adjustment</AppButton>
      </div>
      <AdminTable title="Recent Inventory Activity" emptyTitle="No inventory movements yet" columns={["Product", "Type", "Quantity", "Before", "After", "Reference", "Created"]} embedded />
    </section>
  );
}

export function AdminCustomers() {
  return <AdminTable title="Customers" emptyTitle="No customers yet" columns={["Name", "Phone", "Alternate phone", "Email", "Created"]} icon={faUsers} />;
}

export function AdminReports() {
  return <section className="admin-page"><AdminHeader title="Reports" copy="Sales, inventory, and customer reporting foundation." /><div className="admin-panel"><div className="chart-placeholder" /></div></section>;
}

export function AdminSettings() {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  async function saveSettings() {
    setError("");
    setMessage("");
    try {
      const response = await api.put("/admin/settings", toStoredSiteSettingsMedia(form));
      setForm(normalizeSiteSettings(response.data));
      setMessage("Settings saved.");
    } catch (requestError: any) {
      setError(extractApiError(requestError, "Settings could not be saved.").message);
    }
  }

  async function uploadMedia(slot: string, file: File | null) {
    if (!file) return;
    const payload = new FormData();
    payload.append("image", file);
    try {
      const response = await api.post(`/admin/settings/media/${slot}`, payload);
      setForm(normalizeSiteSettings(response.data));
      setMessage("Media updated.");
    } catch (requestError: any) {
      setError(extractApiError(requestError, "Media upload failed.").message);
    }
  }

  async function removeMedia(key: keyof SiteSettings) {
    setError("");
    setMessage("");
    try {
      const response = await api.put("/admin/settings", { [key]: "" });
      setForm(normalizeSiteSettings(response.data));
      setMessage("Media removed. Static fallback is active.");
    } catch (requestError: any) {
      setError(extractApiError(requestError, "Media could not be removed.").message);
    }
  }

  return (
    <section className="admin-page">
      <AdminHeader title="Settings" copy="Manage contact settings, social links, storefront media, collection details, and delivery defaults from one place." />
      <div className="admin-panel form-stack">
        <div className="form-grid">
          <Field label="Shop name" value={form.shopName} onChange={(event) => setForm({ ...form, shopName: event.target.value })} />
          <Field label="Logo text" value={form.logo} onChange={(event) => setForm({ ...form, logo: event.target.value })} />
          <Field label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Field label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Field label="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <Field label="WhatsApp Channel URL" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} />
          <Field label="Facebook URL" value={form.facebook} onChange={(event) => setForm({ ...form, facebook: event.target.value })} />
          <Field label="TikTok URL" value={form.tiktok} onChange={(event) => setForm({ ...form, tiktok: event.target.value })} />
          <Field label="Instagram URL" value={form.instagram} onChange={(event) => setForm({ ...form, instagram: event.target.value })} />
          <Field label="EcoCash Merchant Name" value={form.ecocashMerchantName} onChange={(event) => setForm({ ...form, ecocashMerchantName: event.target.value })} />
          <Field label="EcoCash Merchant Number" value={form.ecocashMerchantNumber} onChange={(event) => setForm({ ...form, ecocashMerchantNumber: event.target.value })} />
          <Field label="Default Delivery Fee" type="number" value={String(form.defaultDeliveryFee)} onChange={(event) => setForm({ ...form, defaultDeliveryFee: Number(event.target.value) })} />
        </div>
        <TextAreaField label="Collection Instructions" value={form.collectionInstructions} onChange={(event) => setForm({ ...form, collectionInstructions: event.target.value })} />
        <div className="admin-media-grid">
          {mediaSlots.map((item) => {
            const preview = resolveMediaUrl(form[item.key] as string | undefined) || "/images/site/placeholder-product.jpg";
            return (
              <div className="media-slot-card" key={item.slot}>
                <div className="media-slot-card__preview">
                  <img src={preview} alt={`${item.label} preview`} />
                </div>
                <div className="media-slot-card__body">
                  <strong>{item.label}</strong>
                  <span>Upload, preview, replace, or remove this storefront image.</span>
                </div>
                <label className="upload-zone upload-zone--compact">
                  <FontAwesomeIcon icon={faCloudArrowUp} />
                  <span>Upload or Replace</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadMedia(item.slot, event.target.files?.[0] ?? null)} />
                </label>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => void removeMedia(item.key)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
        {error && <div className="error-card">{error}</div>}
        {message && <div className="status-banner">{message}</div>}
        <AppButton onClick={saveSettings}>Save Settings</AppButton>
      </div>
    </section>
  );
}

export function AdminAccount() {
  const { account, error } = useAdminAccount();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  async function changePassword() {
    setMessage("");
    setSubmitError("");
    try {
      await api.post("/admin/account/change-password", passwordForm);
      setMessage("Password updated.");
      setPasswordForm({ currentPassword: "", nextPassword: "", confirmPassword: "" });
    } catch (requestError: any) {
      setSubmitError(extractApiError(requestError, "Password could not be changed.").message);
    }
  }

  return (
    <section className="admin-page">
      <AdminHeader title="User Account" copy="View the verified admin profile and change the password without changing role or account status." />
      <div className="admin-grid">
        <div className="admin-panel form-stack">
          {error && <div className="error-card">{error}</div>}
          <div className="account-grid">
            <AccountLine label="First Name" value={account?.first_name || "-"} />
            <AccountLine label="Surname" value={account?.surname || "-"} />
            <AccountLine label="Email" value={account?.email || "-"} />
            <AccountLine label="Role" value={account?.role || "-"} />
            <AccountLine label="Account Status" value={account?.status || "-"} />
            <AccountLine label="Email Verification Status" value={account?.email_verified_at ? "Verified" : "Pending"} />
            <AccountLine label="Last Login" value={account?.last_login_at ? new Date(account.last_login_at).toLocaleString() : "No login recorded"} />
          </div>
        </div>
        <div className="admin-panel form-stack">
          <h2>Change Password</h2>
          <Field label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} />
          <Field label="New Password" type="password" value={passwordForm.nextPassword} onChange={(event) => setPasswordForm({ ...passwordForm, nextPassword: event.target.value })} />
          <Field label="Confirm Password" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} />
          {submitError && <div className="error-card">{submitError}</div>}
          {message && <div className="status-banner">{message}</div>}
          <AppButton onClick={changePassword}>Change Password</AppButton>
        </div>
      </div>
    </section>
  );
}

export function AdminSubscribers() {
  const { subscribers, loading, error, setSubscribers } = useSubscribers();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sendForm, setSendForm] = useState({ target: "selected", templateName: "stock_alert", product: "", customNote: "" });
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");

  const visibleSubscribers = useMemo(
    () =>
      subscribers.filter((subscriber) => {
        if (statusFilter !== "ALL" && subscriber.status !== statusFilter) return false;
        if (!search) return true;
        const term = search.toLowerCase();
        return Boolean(subscriber.name?.toLowerCase().includes(term) || subscriber.whatsapp_number.toLowerCase().includes(term));
      }),
    [search, statusFilter, subscribers]
  );

  async function deactivateSubscriber(id: string) {
    try {
      const response = await api.patch(`/admin/subscribers/${id}/status`, { status: "INACTIVE" });
      setSubscribers((current) => current.map((item) => (item.id === id ? response.data : item)));
    } catch (requestError: any) {
      setSendError(extractApiError(requestError, "Subscriber status could not be updated.").message);
    }
  }

  async function sendMessages() {
    setMessage("");
    setSendError("");
    try {
      const response = await api.post("/admin/subscribers/send", {
        ...sendForm,
        subscriberIds: sendForm.target === "all" ? [] : selected
      });
      setMessage(`Processed ${response.data.eligibleCount} eligible subscriber(s).`);
    } catch (requestError: any) {
      setSendError(extractApiError(requestError, "Messages could not be queued.").message);
    }
  }

  function toggleSelected(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectAllActive() {
    setSelected(visibleSubscribers.filter((subscriber) => subscriber.status === "ACTIVE" && subscriber.opted_in).map((subscriber) => subscriber.id));
  }

  return (
    <section className="admin-page">
      <AdminHeader title="Stock Alerts" copy="Manage WhatsApp subscribers, filter by opt-in status, and prepare controlled stock update sends." />
      <div className="admin-panel form-stack">
        <div className="form-grid">
          <Field label="Search by name or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
          <SelectField label="Filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {["ALL", "ACTIVE", "UNSUBSCRIBED", "INACTIVE"].map((item) => <option key={item}>{item}</option>)}
          </SelectField>
        </div>
        <div className="action-panel">
          <button type="button" onClick={selectAllActive}>Select All Active</button>
          <span className="muted">{selected.length} selected</span>
        </div>
        {error && <div className="error-card">{error}</div>}
        {loading ? <div className="status-banner">Loading subscribers...</div> : (
          <div className="admin-panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                  <th>WhatsApp Number</th>
                  <th>Opt-in Status</th>
                  <th>Opt-in Date</th>
                  <th>Last Notification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleSubscribers.length ? visibleSubscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td><input type="checkbox" checked={selected.includes(subscriber.id)} onChange={() => toggleSelected(subscriber.id)} /></td>
                    <td>{subscriber.name || "-"}</td>
                    <td>{subscriber.whatsapp_number}</td>
                    <td>{subscriber.opted_in ? "Opted In" : "Not Opted In"}</td>
                    <td>{subscriber.opted_in_at ? new Date(subscriber.opted_in_at).toLocaleString() : "-"}</td>
                    <td>{subscriber.last_notification_at ? new Date(subscriber.last_notification_at).toLocaleString() : "Never"}</td>
                    <td>{subscriber.status}</td>
                    <td className="table-actions">
                      <button type="button" onClick={() => setSelected([subscriber.id])}>Send Message</button>
                      <button type="button" onClick={() => deactivateSubscriber(subscriber.id)}>Deactivate</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={8}><EmptyInline icon={faUserCheck} title="No subscribers found" /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="admin-panel form-stack">
        <h2><FontAwesomeIcon icon={faPaperPlane} /> Send WhatsApp Stock Alert</h2>
        <div className="form-grid">
          <SelectField label="Target" value={sendForm.target} onChange={(event) => setSendForm({ ...sendForm, target: event.target.value })}>
            <option value="individual">Individual Subscriber</option>
            <option value="selected">Selected Subscribers</option>
            <option value="all">All Active Subscribers</option>
          </SelectField>
          <Field label="Template" value={sendForm.templateName} onChange={(event) => setSendForm({ ...sendForm, templateName: event.target.value })} />
          <Field label="Product" value={sendForm.product} onChange={(event) => setSendForm({ ...sendForm, product: event.target.value })} />
          <TextAreaField label="Optional Custom Internal Note" className="span-2" value={sendForm.customNote} onChange={(event) => setSendForm({ ...sendForm, customNote: event.target.value })} />
        </div>
        {sendError && <div className="error-card">{sendError}</div>}
        {message && <div className="status-banner">{message}</div>}
        <AppButton onClick={sendMessages}>Send Message</AppButton>
      </div>
    </section>
  );
}

function AdminHeader({ title, copy }: { title: string; copy: string }) {
  return <div className="admin-header"><h1>{title}</h1><p>{copy}</p></div>;
}

function AccountLine({ label, value }: { label: string; value: string }) {
  return <div className="account-line"><span>{label}</span><strong>{value}</strong></div>;
}

function AdminTable({ title, columns, filters = [], emptyTitle, icon = faBox, embedded = false }: { title: string; columns: string[]; filters?: string[]; emptyTitle: string; icon?: any; embedded?: boolean }) {
  return (
    <section className={embedded ? "admin-table-section" : "admin-page"}>
      {title && <AdminHeader title={title} copy="Filter, scan, and manage records." />}
      {filters.length > 0 && <div className="admin-filters">{filters.map((item) => <button key={item}>{item}</button>)}</div>}
      <div className="admin-panel table-wrap">
        <table>
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody><tr>{columns.map((column, index) => <td key={column}>{index === 0 ? <EmptyInline icon={icon} title={emptyTitle} /> : "-"}</td>)}</tr></tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyInline({ icon, title }: { icon: any; title: string }) {
  return <span className="table-empty"><FontAwesomeIcon icon={icon} /> {title}</span>;
}

function readFlashMessage(state: unknown) {
  if (!state || typeof state !== "object") return "";
  const message = (state as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
}

function validateProductForm(form: ProductFormState) {
  const errors: ProductFormErrors = {};

  if (!form.name.trim()) errors.name = "Product name is required.";
  if (!slugify(form.slug || form.name)) errors.slug = "Product URL slug is required.";
  if (!form.sku.trim()) errors.sku = "SKU is required.";
  if (!form.categoryId) errors.categoryId = "Select a category.";

  const price = Number(form.price);
  if (!form.price.trim() || Number.isNaN(price) || price < 0) {
    errors.price = "Enter a valid selling price.";
  }

  if (form.previousPrice.trim()) {
    const previousPrice = Number(form.previousPrice);
    if (Number.isNaN(previousPrice) || previousPrice < 0) {
      errors.previousPrice = "Enter a valid non-negative previous price.";
    }
  }

  const stockQuantity = Number(form.stockQuantity);
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    errors.stockQuantity = "Stock must be 0 or greater.";
  }

  const lowStockThreshold = Number(form.lowStockThreshold);
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    errors.lowStockThreshold = "Low-stock threshold must be 0 or greater.";
  }

  return errors;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeDecimal(value: string | number | null | undefined) {
  if (value == null) return "";
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "";
}

function normalizeOptionalDecimal(value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  return normalizeDecimal(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
