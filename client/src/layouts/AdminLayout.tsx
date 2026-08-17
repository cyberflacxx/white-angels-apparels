import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBoxesStacked, faChartLine, faGear, faLayerGroup, faRightFromBracket, faShirt, faShoppingCart, faUsers, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  ["Dashboard", "/admin", faChartLine],
  ["Orders", "/admin/orders", faShoppingCart],
  ["Products", "/admin/products", faShirt],
  ["Categories", "/admin/categories", faLayerGroup],
  ["Inventory", "/admin/inventory", faBoxesStacked],
  ["Customers", "/admin/customers", faUsers],
  ["Reports", "/admin/reports", faChartLine],
  ["Settings", "/admin/settings", faGear]
] as const;

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <main className={open ? "admin-shell admin-shell--open" : "admin-shell"}>
      <aside>
        <div className="admin-brand">
          <span>WA</span>
          <strong>White Angels Apparels</strong>
        </div>
        {links.map(([label, href, icon]) => (
          <NavLink key={href} to={href} end={href === "/admin"} onClick={() => setOpen(false)}>
            <FontAwesomeIcon icon={icon} /> {label}
          </NavLink>
        ))}
        <button className="admin-logout">
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </aside>
      <section className="admin-workspace">
        <div className="admin-topbar">
          <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close admin navigation" : "Open admin navigation"}>
            <FontAwesomeIcon icon={open ? faXmark : faBars} />
          </button>
          <span>Administration Dashboard</span>
        </div>
        <Outlet />
      </section>
    </main>
  );
}
