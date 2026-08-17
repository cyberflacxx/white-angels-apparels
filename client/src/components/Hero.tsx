import type { ReactNode } from "react";
import { Container } from "./UI";

export function Hero({ title, subtitle, image, children, compact = false }: { title: string; subtitle?: string; image: string; children?: ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? "hero page-hero" : "hero"} style={{ backgroundImage: `linear-gradient(90deg, rgba(15,23,42,.72), rgba(15,23,42,.34)), linear-gradient(rgba(15,23,42,.28), rgba(15,23,42,.42)), url(${image})` }}>
      <Container className="hero__content">
        <p className="eyebrow">White Angels Apparels</p>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </Container>
    </section>
  );
}
