import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Track Order", "/track-order"]
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return (
    <header className="navbar">
      <Link to="/" className="logo" onClick={() => setOpen(false)}>
        White Angels Apparels
      </Link>
      <nav className={open ? "navlinks navlinks--open" : "navlinks"}>
        {links.map(([label, href]) => (
          <NavLink key={href} to={href} onClick={() => setOpen(false)}>
            {label}
          </NavLink>
        ))}
        <NavLink to="/cart" className="cart-link" onClick={() => setOpen(false)}>
          <ShoppingBag size={18} /> Cart <span>{count}</span>
        </NavLink>
      </nav>
      <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
