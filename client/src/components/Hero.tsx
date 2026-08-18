import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import { resolveMediaUrl } from "../lib/media";
import { Container } from "./UI";

export function Hero({ title, subtitle, image, children, compact = false, className = "" }: { title: string; subtitle?: string; image?: string; children?: ReactNode; compact?: boolean; className?: string }) {
  const heroImage = resolveMediaUrl(image);
  const heroStyle: CSSProperties = {
    backgroundColor: "#0F172A",
    backgroundImage: heroImage
      ? `linear-gradient(90deg, rgba(15,23,42,.72), rgba(15,23,42,.34)), linear-gradient(rgba(15,23,42,.28), rgba(15,23,42,.42)), url(${heroImage})`
      : "linear-gradient(135deg, rgba(15,23,42,.95), rgba(37,106,217,.82))"
  };

  return (
    <section className={`${compact ? "hero page-hero" : "hero"} ${className}`.trim()} style={heroStyle}>
      <Container className="hero__content">
        <p className="eyebrow">White Angels Apparels</p>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </Container>
    </section>
  );
}
