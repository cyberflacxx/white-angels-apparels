import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faBoxesStacked, faChartLine, faCloudArrowUp, faDollarSign, faLayerGroup, faPaperPlane, faPlus, faShoppingCart, faUsers, faUserCheck } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppButton, EmptyState, Field, SelectField, TextAreaField } from "../components/UI";
import { api, type SiteSettings } from "../lib/api";
import { useAdminAccount, useSiteSettings, useSubscribers } from "./hooks";

const cards = [
  ["Today Sales", "$0", faDollarSign],
  ["Orders", "0", faShoppingCart],
  ["Pending", "0", faChartLine],
  ["Stock", "0", faBoxesStacked],
  ["Customers", "0", faUsers]
] as const;

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
  { label: "Home Promo Banner", slot: "homePromoBanner", key: "homePromoBanner" }
] as const;

export function AdminDashboard() {
  const { account } = useAdminAccount();

  return (
    <section className="admin-page">
      <AdminHeader title={`Welcome, ${account?.first_name || "Admin"}`} copy="Operational overview for White Angels Apparels." />
      <div className="metric-grid">{cards.map(([card, value, icon]) => <article key={card}><FontAwesomeIcon icon={icon} /><span>{card}</span><strong>{value}</strong></article>)}</div>
      <div className="admin-grid">
        <div className="admin-panel"><h2>Recent orders</h2><EmptyState title="No orders yet" copy="Order activity appears here after customers begin checking out." /></div>
        <div className="admin-panel"><h2>Sales overview</h2><div className="chart-placeholder" /></div>
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
  return (
    <section className="admin-page">
      <div className="admin-header admin-header--row">
        <div><h1>Products</h1><p>Add products, edit details, manage images, change prices, update stock, and deactivate items from one place.</p></div>
        <Link className="btn btn--primary" to="/admin/products/new"><FontAwesomeIcon icon={faPlus} /> Add Product</Link>
      </div>
      <AdminTable title="" emptyTitle="No products yet" columns={["Image", "Name", "SKU", "Category", "Price", "Stock", "Status", "Featured", "Actions"]} embedded />
    </section>
  );
}

export function ProductForm() {
  return (
    <section className="admin-page">
      <AdminHeader title="Product Form" copy="Add product details, upload a main image, add extra images, and prepare future image ordering controls." />
      <div className="admin-panel form-stack">
        <div className="admin-helper-list" aria-label="Product management actions">
          {["Add Product", "Edit Product", "Upload Images", "Set Primary Image", "Delete Image", "Update Stock", "Deactivate Product"].map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="form-grid">
          {["Name", "Slug", "SKU", "Price", "Previous price", "Stock", "Low-stock threshold", "Category"].map((item) => <Field key={item} label={item} />)}
        </div>
        <TextAreaField label="Description" />
        <label className="upload-zone">
          <FontAwesomeIcon icon={faCloudArrowUp} />
          <strong>Upload Product Images</strong>
          <span>Main and additional product images can be selected here. Use this structure when wiring the final product media API.</span>
          <input type="file" multiple />
        </label>
        <AppButton>Save Product</AppButton>
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
      await api.put("/admin/settings", form);
      setMessage("Settings saved.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Settings could not be saved.");
    }
  }

  async function uploadMedia(slot: string, file: File | null) {
    if (!file) return;
    const payload = new FormData();
    payload.append("image", file);
    try {
      const response = await api.post(`/admin/settings/media/${slot}`, payload);
      setForm(response.data);
      setMessage("Media updated.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Media upload failed.");
    }
  }

  async function removeMedia(key: keyof SiteSettings) {
    setError("");
    setMessage("");
    try {
      const response = await api.put("/admin/settings", { [key]: "" });
      setForm(response.data);
      setMessage("Media removed. Static fallback is active.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Media could not be removed.");
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
            const preview = (form[item.key] as string | undefined) || "";
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
      setSubmitError(requestError?.response?.data?.message || "Password could not be changed.");
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
      setSendError(requestError?.response?.data?.message || "Subscriber status could not be updated.");
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
      setSendError(requestError?.response?.data?.message || "Messages could not be queued.");
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
