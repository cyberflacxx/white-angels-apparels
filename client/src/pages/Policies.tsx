import { Hero } from "../components/Hero";
import { Container, Section } from "../components/UI";
import { useSiteSettings } from "./hooks";

export function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      subtitle="Practical terms for browsing, ordering, payment, delivery, collection, and store updates."
      sections={[
        {
          heading: "Orders and availability",
          points: [
            "Product listings, prices, and availability may change as stock is updated.",
            "Submitting an order does not guarantee final fulfilment until White Angels Apparels confirms the order.",
            "If an item becomes unavailable after checkout, the customer will be contacted with the next available step."
          ]
        },
        {
          heading: "Payments",
          points: [
            "EcoCash references and related payment details are reviewed before completion where manual verification is required.",
            "Cash payment options depend on the selected fulfilment method and the final confirmed order.",
            "White Angels Apparels may decline or cancel suspicious or incomplete payment submissions."
          ]
        },
        {
          heading: "Delivery and collection",
          points: [
            "Delivery and collection options are presented during checkout and may depend on the confirmed order details.",
            "Delivery fees communicated during checkout or confirmation form part of the final order total.",
            "Collection arrangements are communicated directly to the customer after order review where applicable."
          ]
        },
        {
          heading: "Customer responsibilities",
          points: [
            "Customers should provide accurate contact, delivery, and payment-reference information.",
            "Customers should use the store and contact channels lawfully and respectfully.",
            "White Angels Apparels may update these terms when operations, pricing, or fulfilment processes change."
          ]
        }
      ]}
    />
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      subtitle="How White Angels Apparels handles contact details, order information, and WhatsApp subscriber consent."
      sections={[
        {
          heading: "Information collected",
          points: [
            "White Angels Apparels collects customer details supplied for orders, delivery, collection, support, and payment follow-up.",
            "WhatsApp subscriber details are collected only when a customer explicitly opts in to receive updates.",
            "The store may also keep basic records of order status, payment references, and subscriber activity dates."
          ]
        },
        {
          heading: "How information is used",
          points: [
            "Customer information is used to process orders, confirm fulfilment, and respond to enquiries.",
            "Subscriber information is used for stock-update communication and subscriber-status management.",
            "White Angels Apparels does not state that customer data is sold to outside parties through this storefront."
          ]
        },
        {
          heading: "Consent and control",
          points: [
            "WhatsApp updates are sent only to customers who have opted in.",
            "Subscribers may request to unsubscribe or be deactivated from update lists.",
            "Order-related contact may still be required where necessary to complete or resolve an order."
          ]
        },
        {
          heading: "Security and retention",
          points: [
            "White Angels Apparels takes reasonable steps to limit access to customer and subscriber records.",
            "No system can promise absolute security, but operational controls are used to reduce unnecessary exposure.",
            "Information may be retained for business records, order support, and store administration where reasonably required."
          ]
        }
      ]}
    />
  );
}

export function DeliveryPolicyPage() {
  return (
    <PolicyPage
      title="Delivery & Collection Policy"
      subtitle="Clear guidance on home delivery, shop collection, confirmation steps, and related customer expectations."
      sections={[
        {
          heading: "Home delivery",
          points: [
            "Home delivery details are provided by the customer during checkout and may be reviewed before fulfilment.",
            "Delivery timing can depend on stock confirmation, payment review, and destination details.",
            "Delivery fees are communicated during checkout or confirmation and may vary by fulfilment requirements."
          ]
        },
        {
          heading: "Shop collection",
          points: [
            "Collection is available for qualifying orders and is confirmed directly with the customer.",
            "Customers should wait for collection confirmation before travelling to collect an order.",
            "Collection support may include guidance on timing, order reference, and pickup coordination."
          ]
        },
        {
          heading: "Order confirmation",
          points: [
            "Fulfilment remains subject to confirmed stock, complete customer details, and any required payment verification.",
            "White Angels Apparels may contact the customer if more information is needed before delivery or collection.",
            "If a confirmed order cannot proceed as expected, the customer will be informed of the next available option."
          ]
        }
      ]}
    />
  );
}

export function ReturnsPolicyPage() {
  return (
    <PolicyPage
      title="Returns & Exchange Policy"
      subtitle="A practical store policy for item condition, order issues, and customer resolution steps."
      sections={[
        {
          heading: "Condition expectations",
          points: [
            "Any return or exchange discussion depends on the item being kept in a clean, resaleable condition unless the issue is a confirmed defect or fulfilment error.",
            "Customers should keep order references and communicate concerns promptly after receiving the item.",
            "Items showing avoidable damage, misuse, or clear wear may not qualify for exchange support."
          ]
        },
        {
          heading: "How issues are handled",
          points: [
            "White Angels Apparels encourages customers to contact the store directly for sizing, fulfilment, or item-condition concerns.",
            "Resolutions may include exchange guidance, practical store support, or another reasonable next step based on the order.",
            "Any approval remains subject to stock availability and the specific condition of the returned item."
          ]
        },
        {
          heading: "Important note",
          points: [
            "These pages are provided as business information for customers using the White Angels Apparels storefront.",
            "They are not legal advice and may be updated as the business process develops."
          ]
        }
      ]}
    />
  );
}

function PolicyPage({ title, subtitle, sections }: { title: string; subtitle: string; sections: Array<{ heading: string; points: string[] }> }) {
  const { settings } = useSiteSettings();

  return (
    <main>
      <Hero className="hero--policy" title={title} subtitle={subtitle} image={settings.heroProduct} compact />
      <Section>
        <Container className="policy-page">
          {sections.map((section) => (
            <article className="policy-block" key={section.heading}>
              <h2>{section.heading}</h2>
              <ul>
                {section.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </article>
          ))}
        </Container>
      </Section>
    </main>
  );
}
