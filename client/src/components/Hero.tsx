import type { ReactNode } from "react";

export function Hero({ title, subtitle, image, children }: { title: string; subtitle?: string; image: string; children?: ReactNode }) {
  return (
    <section className="hero" style={{ backgroundImage: `linear-gradient(rgba(7,7,7,.62), rgba(7,7,7,.36)), url(${image})` }}>
      <div className="hero__content">
        <p className="eyebrow">White Angels Apparels</p>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
