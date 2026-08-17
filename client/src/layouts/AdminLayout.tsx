import { BarChart3, Boxes, LayoutDashboard, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Orders", "/admin/orders", ShoppingCart],
  ["Products", "/admin/products", Package],
  ["Categories", "/admin/categories", Boxes],
  ["Inventory", "/admin/inventory", Boxes],
  ["Customers", "/admin/customers", Users],
  ["Reports", "/admin/reports", BarChart3],
  ["Settings", "/admin/settings", Settings]
] as const;

export function AdminLayout() {
  return (
    <main className="admin-shell">
      <aside>
        <h2>White Angels</h2>
        {links.map(([label, href, Icon]) => (
          <NavLink key={href} to={href} end={href === "/admin"}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </aside>
      <section className="admin-workspace">
        <div className="admin-topbar">Administration Dashboard</div>
        <Outlet />
      </section>
    </main>
  );
}
