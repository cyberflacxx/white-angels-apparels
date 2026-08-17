import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { WHATSAPP_CHANNEL_URL } from "../lib/site";

export function FloatingWhatsAppButton() {
  return (
    <a
      className="floating-whatsapp"
      href={WHATSAPP_CHANNEL_URL}
      aria-label="Open White Angels WhatsApp Channel"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FontAwesomeIcon icon={faWhatsapp} />
      <span>WhatsApp Channel</span>
    </a>
  );
}
