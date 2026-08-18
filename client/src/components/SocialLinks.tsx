import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getPublicSocialLinks } from "../lib/site";

type SocialSettings = Parameters<typeof getPublicSocialLinks>[0];
type SocialPlatform = ReturnType<typeof getPublicSocialLinks>[number]["platform"];

const socialIcons: Record<SocialPlatform, IconDefinition> = {
  whatsapp: faWhatsapp,
  facebook: faFacebookF,
  tiktok: faTiktok,
  instagram: faInstagram
};

export function SocialLinks({
  settings,
  large = false,
  className = "socials"
}: {
  settings: SocialSettings;
  large?: boolean;
  className?: string;
}) {
  const socials = getPublicSocialLinks(settings);
  return (
    <div className={large ? `${className} socials--large` : className}>
      {socials.map((item) =>
        item.enabled ? (
          <a
            href={item.href}
            key={item.label}
            aria-label={item.label}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-link social-link--${item.platform}`}
          >
            <FontAwesomeIcon icon={socialIcons[item.platform]} />
          </a>
        ) : (
          <span
            key={item.label}
            className={`socials__disabled socials__disabled--${item.platform}`}
            aria-label={`${item.label} not configured`}
          >
            <FontAwesomeIcon icon={socialIcons[item.platform]} />
          </span>
        )
      )}
    </div>
  );
}
