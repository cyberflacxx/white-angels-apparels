import { Hero } from "../components/Hero";

export function About() {
  return (
    <main>
      <Hero title="About White Angels" subtitle="A fashion brand placeholder story ready for the real company narrative." image="/images/hero-about.jpg" />
      <section className="section info-grid">{["Brand values", "Quality commitment", "Customer experience", "Fashion imagery"].map((title) => <div key={title}><h2>{title}</h2><p>Replace this with final brand copy and photography as the catalogue matures.</p></div>)}</section>
    </main>
  );
}
