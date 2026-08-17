import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { WHATSAPP_CHANNEL_URL } from "../lib/site";
import { useSiteSettings } from "../pages/hooks";

export function FloatingWhatsAppButton() {
  const { settings } = useSiteSettings();

  return (
    <a
      className="floating-whatsapp"
      href={settings.whatsapp || WHATSAPP_CHANNEL_URL}
      aria-label="Open White Angels WhatsApp Channel"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FontAwesomeIcon icon={faWhatsapp} />
      <span>WhatsApp Channel</span>
    </a>
  );
}
