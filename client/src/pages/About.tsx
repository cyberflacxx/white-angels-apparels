import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGem, faHeart, faStore, faTruck } from "@fortawesome/free-solid-svg-icons";
import { Hero } from "../components/Hero";
import { AppLink, Container, Section, SectionHeading } from "../components/UI";
import { useSiteSettings } from "./hooks";

export function About() {
  const settings = useSiteSettings();
  return (
    <main>
      <Hero title="The White Angels Story." subtitle="A clean, premium fashion experience ready for the real brand narrative and photography." image="/images/hero-about.jpg" compact />
      <Section>
        <Container className="two-column story-block">
          <div>
            <p className="eyebrow">About</p>
            <h2>Fashion presented with calm confidence.</h2>
          </div>
          <p>White Angels Apparels is structured for a polished catalogue, clear fulfilment choices, and a store experience that feels spacious on every device. The visual system is ready for final brand copy and apparel photography.</p>
        </Container>
      </Section>
      <Section className="surface-section">
        <Container>
          <SectionHeading eyebrow="Promise" title="Style, service, and clarity" />
          <div className="info-grid">
            <Feature icon={faGem} title="Quality Selection" copy="A focused structure for showcasing premium apparel." />
            <Feature icon={faHeart} title="Brand Care" copy="A storefront designed to keep the product photography in focus." />
            <Feature icon={faTruck} title="Delivery" copy="Customers can choose home delivery during checkout." />
            <Feature icon={faStore} title="Collection" copy={settings.collectionInstructions || "Collection details are confirmed after approval."} />
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="promo-lite">
          <h2>Ready to browse the collection?</h2>
          <AppLink to="/shop">Shop White Angels</AppLink>
        </Container>
      </Section>
    </main>
  );
}

function Feature({ icon, title, copy }: { icon: any; title: string; copy: string }) {
  return (
    <article className="feature-card">
      <FontAwesomeIcon icon={icon} />
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}
