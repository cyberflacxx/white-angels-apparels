import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faCartShopping, faMagnifyingGlass, faUserShield, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { resolveMediaUrl } from "../lib/media";
import { useSiteSettings } from "../pages/hooks";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Track Order", "/track-order"]
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();
  const { settings } = useSiteSettings();
  const logoUrl = resolveMediaUrl(settings.logoUrl) || "/images/site/logo-white-angels.png";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <header className={scrolled || open ? "navbar navbar--solid" : "navbar"}>
      <Link to="/" className="logo" onClick={() => setOpen(false)}>
        {settings.logoUrl ? <img src={logoUrl} alt="White Angels Apparels logo" /> : <span>WA</span>}
        <strong>{settings.shopName || "White Angels Apparels"}</strong>
      </Link>
      <nav className={open ? "navlinks navlinks--open" : "navlinks"} aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <NavLink key={href} to={href} onClick={() => setOpen(false)}>
            {label}
          </NavLink>
        ))}
        <NavLink className="navlinks__admin" to="/admin/login" onClick={() => setOpen(false)}>
          <FontAwesomeIcon icon={faUserShield} /> Admin
        </NavLink>
      </nav>
      <div className="nav-actions">
        <Link to="/shop" className="icon-button desktop-only" aria-label="Search products">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </Link>
        <NavLink to="/cart" className="icon-button cart-link" aria-label="View cart" onClick={() => setOpen(false)}>
          <FontAwesomeIcon icon={faCartShopping} />
          <span>{count}</span>
        </NavLink>
        <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close navigation menu" : "Open navigation menu"}>
          <FontAwesomeIcon icon={open ? faXmark : faBars} />
        </button>
      </div>
    </header>
  );
}
