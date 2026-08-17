export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbADhEcHgZWhkCwTac0B";
export const WHATSAPP_CHANNEL_LABEL = "WhatsApp Channel";

type SocialSettings = {
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
};

export function getPublicSocialLinks(settings: SocialSettings) {
  return [
    { href: settings.whatsapp || WHATSAPP_CHANNEL_URL, label: WHATSAPP_CHANNEL_LABEL, platform: "whatsapp" as const, enabled: true },
    { href: settings.facebook || "", label: "Facebook", platform: "facebook" as const, enabled: Boolean(settings.facebook) },
    { href: settings.tiktok || "", label: "TikTok", platform: "tiktok" as const, enabled: Boolean(settings.tiktok) },
    { href: settings.instagram || "", label: "Instagram", platform: "instagram" as const, enabled: Boolean(settings.instagram) }
  ];
}
