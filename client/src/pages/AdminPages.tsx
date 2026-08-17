import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faBoxesStacked, faChartLine, faCloudArrowUp, faDollarSign, faLayerGroup, faPlus, faShoppingCart, faUsers } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { AppButton, EmptyState, Field, SelectField, TextAreaField } from "../components/UI";

const cards = [
  ["Today Sales", "$0", faDollarSign],
  ["Orders", "0", faShoppingCart],
  ["Pending", "0", faChartLine],
  ["Stock", "0", faBoxesStacked],
  ["Customers", "0", faUsers]
] as const;

export function AdminDashboard() {
  return (
    <section className="admin-page">
      <AdminHeader title="Dashboard" copy="Operational overview for White Angels Apparels." />
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
      <AdminHeader title="Product Form" copy="Add product details and prepare image assets." />
      <div className="admin-panel form-stack">
        <div className="admin-helper-list" aria-label="Product management actions">
          {["Add Product", "Edit Product", "Upload Images", "Change Price", "Update Stock", "Deactivate Product"].map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="form-grid">
          {["Name", "Slug", "SKU", "Price", "Previous price", "Stock", "Low-stock threshold", "Category"].map((item) => <Field key={item} label={item} />)}
        </div>
        <TextAreaField label="Description" />
        <label className="upload-zone">
          <FontAwesomeIcon icon={faCloudArrowUp} />
          <strong>Upload Product Images</strong>
          <span>Choose image files. Previews and primary-image controls fit here when upload logic is wired.</span>
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
  return (
    <section className="admin-page">
      <AdminHeader title="Settings" copy="Centralized public business details and payment information." />
      <div className="admin-panel form-stack">
        <div className="form-grid">
          {["Shop name", "Phone", "Email", "Address", "WhatsApp", "Facebook", "Instagram", "TikTok", "EcoCash merchant details", "Collection instructions", "Default delivery fee"].map((item) => <Field key={item} label={item} />)}
        </div>
        <AppButton>Save Settings</AppButton>
      </div>
    </section>
  );
}

function AdminHeader({ title, copy }: { title: string; copy: string }) {
  return <div className="admin-header"><h1>{title}</h1><p>{copy}</p></div>;
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
