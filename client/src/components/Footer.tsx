import { MessageCircle, Music2, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

const links = {
  quick: ["Home", "Shop", "About", "Contact", "Track Order"],
  shopping: ["New Arrivals", "Featured Products", "Categories", "Cart"],
  care: ["Delivery Information", "Collection Information", "Payment Information", "Order Tracking", "Returns Policy", "Privacy Policy", "Terms and Conditions"]
};

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div>
        <h3>White Angels Apparels</h3>
        <p>Premium fashion pieces, curated for confident everyday and occasion styling.</p>
        <div className="socials">
          <Share2 />
          <Share2 />
          <Music2 />
          <MessageCircle />
        </div>
      </div>
      <FooterList title="Quick Links" items={links.quick} />
      <FooterList title="Shopping" items={links.shopping} />
      <FooterList title="Customer Care" items={links.care} />
      <div>
        <h4>Contact</h4>
        <p>Phone, email, address and WhatsApp are configurable in site settings.</p>
      </div>
      <small>© {year} White Angels Apparels. All rights reserved.</small>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      {items.map((item) => (
        <Link key={item} to={item === "Home" ? "/" : `/${item.toLowerCase().replaceAll(" ", "-")}`}>
          {item}
        </Link>
      ))}
    </div>
  );
}
