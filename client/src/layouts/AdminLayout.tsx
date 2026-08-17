import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBoxesStacked, faChartLine, faChevronDown, faGear, faLayerGroup, faRightFromBracket, faShirt, faShoppingCart, faStore, faUserCog, faUsers, faUsersViewfinder, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAdminToken } from "../lib/adminAuth";
import { useAdminAccount } from "../pages/hooks";

const links = [
  ["Dashboard", "/admin", faChartLine],
  ["Orders", "/admin/orders", faShoppingCart],
  ["Products", "/admin/products", faShirt],
  ["Categories", "/admin/categories", faLayerGroup],
  ["Inventory", "/admin/inventory", faBoxesStacked],
  ["Customers", "/admin/customers", faUsers],
  ["Stock Alerts", "/admin/subscribers", faUsersViewfinder],
  ["Reports", "/admin/reports", faChartLine],
  ["Settings", "/admin/settings", faGear]
] as const;

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const { account } = useAdminAccount();

  function logout() {
    clearAdminToken();
    navigate("/admin/login");
  }

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
        <button className="admin-logout" onClick={logout}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </aside>
      <section className="admin-workspace">
        <div className="admin-topbar">
          <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close admin navigation" : "Open admin navigation"}>
            <FontAwesomeIcon icon={open ? faXmark : faBars} />
          </button>
          <div className="admin-topbar__copy">
            <strong>Welcome, {account?.first_name || "Admin"}</strong>
            <span>User Account</span>
          </div>
          <div className="admin-account-menu">
            <button type="button" className="admin-account-menu__trigger" onClick={() => setAccountOpen((value) => !value)}>
              <FontAwesomeIcon icon={faUserCog} />
              <span>User Account</span>
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
            {accountOpen && (
              <div className="admin-account-menu__panel">
                <Link to="/admin/account" onClick={() => setAccountOpen(false)}>User Account</Link>
                <Link to="/" onClick={() => setAccountOpen(false)}><FontAwesomeIcon icon={faStore} /> Back to Main Site</Link>
                <button type="button" onClick={logout}><FontAwesomeIcon icon={faRightFromBracket} /> Logout</button>
              </div>
            )}
          </div>
        </div>
        <Outlet />
      </section>
    </main>
  );
}
