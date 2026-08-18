import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faBoxesStacked, faChartLine, faChevronDown, faGear, faLayerGroup, faMoon, faRightFromBracket, faShirt, faShoppingCart, faStore, faSun, faUserCog, faUsers, faUsersViewfinder, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAdminToken } from "../lib/adminAuth";
import { resolveMediaUrl } from "../lib/media";
import { useAdminAccount, useSiteSettings } from "../pages/hooks";

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
  const [theme, setTheme] = useState<"light" | "dark">(() => readAdminTheme());
  const navigate = useNavigate();
  const { account } = useAdminAccount();
  const { settings } = useSiteSettings();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const logoUrl = resolveMediaUrl(settings.logoUrl) || "/images/site/white-angels-logo.png";

  useEffect(() => {
    window.localStorage.setItem("wa-admin-theme", theme);
    document.documentElement.dataset.adminTheme = theme;
    return () => {
      delete document.documentElement.dataset.adminTheme;
    };
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  function logout() {
    clearAdminToken();
    navigate("/admin/login");
  }

  return (
    <main className={open ? `admin-shell admin-shell--open admin-shell--${theme}` : `admin-shell admin-shell--${theme}`}>
      {open && <button type="button" className="admin-drawer-backdrop" aria-label="Close admin navigation" onClick={() => setOpen(false)} />}
      <aside aria-label="Admin navigation">
        <div className="admin-brand">
          <img src={logoUrl} alt="White Angels Apparels logo" />
          <div>
            <strong>{settings.shopName || "White Angels Apparels"}</strong>
            <span>Admin workspace</span>
          </div>
        </div>
        <nav className="admin-nav">
          {links.map(([label, href, icon]) => (
            <NavLink key={href} to={href} end={href === "/admin"} onClick={() => setOpen(false)}>
              <FontAwesomeIcon icon={icon} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <button className="admin-logout" onClick={logout}>
            <FontAwesomeIcon icon={faRightFromBracket} /> Logout
          </button>
        </div>
      </aside>
      <section className="admin-workspace">
        <header className="admin-topbar">
          <button className="icon-button mobile-only admin-topbar__menu" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close admin navigation" : "Open admin navigation"}>
            <FontAwesomeIcon icon={open ? faXmark : faBars} />
          </button>
          <div className="admin-topbar__copy">
            <strong>Welcome, {account?.first_name || "Admin"}</strong>
            <span>User Account</span>
          </div>
          <div className="admin-topbar__actions">
            <button
              type="button"
              className="admin-theme-toggle"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            >
              <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
            </button>
            <div className="admin-account-menu" ref={accountMenuRef}>
              <button type="button" className="admin-account-menu__trigger" onClick={() => setAccountOpen((value) => !value)}>
                <FontAwesomeIcon icon={faUserCog} />
                <span>User Account</span>
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
              {accountOpen && (
                <div className="admin-account-menu__panel">
                  <Link className="admin-account-menu__link" to="/admin/account" onClick={() => setAccountOpen(false)}>User Account</Link>
                  <Link className="admin-account-menu__link" to="/" onClick={() => setAccountOpen(false)}><FontAwesomeIcon icon={faStore} /> Back to Main Site</Link>
                  <button className="admin-account-menu__logout" type="button" onClick={logout}><FontAwesomeIcon icon={faRightFromBracket} /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

function readAdminTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("wa-admin-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
