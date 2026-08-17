import { Link } from "react-router-dom";

const cards = ["Today's sales", "Total sales", "Total orders", "Pending orders", "Payment verification", "Home deliveries", "Shop collections", "Total products", "Low stock", "Out of stock", "Customers"];

export function AdminDashboard() {
  return <section className="admin-page"><div className="metric-grid">{cards.map((card) => <article key={card}><span>{card}</span><strong>0</strong></article>)}</div><div className="admin-panel"><h2>Recent orders</h2><p>Order activity appears here after the database is connected.</p></div><div className="admin-panel"><h2>Sales overview</h2><div className="chart-placeholder" /></div></section>;
}

export function AdminOrders() {
  return <AdminTable title="Orders" columns={["Order number", "Customer", "Phone", "Amount", "Payment", "Fulfilment", "Status", "Created", "Actions"]} filters={["All", "Pending", "Paid", "EcoCash", "Cash", "Home Delivery", "Shop Collection", "Completed", "Cancelled"]} />;
}

export function AdminOrderDetail() {
  return <section className="admin-page"><h1>Order Detail</h1><div className="admin-panel"><p>Customer, items, payment proof, delivery address, status history and order actions are prepared here.</p>{["Verify Payment", "Reject Payment", "Confirm Order", "Mark Preparing", "Ready for Collection", "Out for Delivery", "Delivered", "Collected", "Cancel Order"].map((item) => <button key={item}>{item}</button>)}</div></section>;
}

export function AdminProducts() {
  return <section className="admin-page"><div className="section-head"><h1>Products</h1><Link to="/admin/products/new">Add Product</Link></div><AdminTable title="" columns={["Image", "Name", "SKU", "Category", "Price", "Stock", "Status", "Featured", "Actions"]} /></section>;
}

export function ProductForm() {
  return <section className="admin-page form-stack"><h1>Product Form</h1>{["Name", "Slug", "SKU", "Price", "Previous price", "Stock", "Low-stock threshold", "Category"].map((item) => <input key={item} placeholder={item} />)}<textarea placeholder="Description" /><input type="file" multiple /><button>Save Product</button></section>;
}

export function AdminCategories() {
  return <AdminTable title="Categories" columns={["Name", "Slug", "Status", "Created", "Actions"]} />;
}

export function AdminInventory() {
  return <section className="admin-page"><h1>Inventory</h1><div className="form-stack"><select><option>Select product</option></select><select><option>STOCK_IN</option><option>SALE</option><option>ADJUSTMENT</option><option>RETURN</option><option>DAMAGED</option></select><input placeholder="Quantity" /><input placeholder="Reason" /><textarea placeholder="Notes" /><button>Record Adjustment</button></div><AdminTable title="Recent Inventory Activity" columns={["Product", "Type", "Quantity", "Before", "After", "Reference", "Created"]} /></section>;
}

export function AdminCustomers() {
  return <AdminTable title="Customers" columns={["Name", "Phone", "Alternate phone", "Email", "Created"]} />;
}

export function AdminReports() {
  return <section className="admin-page"><h1>Reports</h1><div className="chart-placeholder" /><p>Sales, inventory and customer reporting foundation.</p></section>;
}

export function AdminSettings() {
  return <section className="admin-page form-stack"><h1>Settings</h1>{["Shop name", "Phone", "Email", "Address", "WhatsApp", "Facebook", "Instagram", "TikTok", "EcoCash merchant details", "Collection instructions", "Default delivery fee"].map((item) => <input key={item} placeholder={item} />)}<button>Save Settings</button></section>;
}

function AdminTable({ title, columns, filters = [] }: { title: string; columns: string[]; filters?: string[] }) {
  return <section className="admin-page"><h1>{title}</h1>{filters.length > 0 && <div className="filters">{filters.map((item) => <button key={item}>{item}</button>)}</div>}<div className="admin-panel table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody><tr>{columns.map((column) => <td key={column}>-</td>)}</tr></tbody></table></div></section>;
}
