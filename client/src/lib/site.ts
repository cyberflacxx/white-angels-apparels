export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbADhEcHgZWhkCwTac0B";
export const WHATSAPP_CHANNEL_LABEL = "WhatsApp Channel";

type SocialSettings = {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
};

export function getPublicSocialLinks(settings: SocialSettings) {
  return [
    { href: WHATSAPP_CHANNEL_URL, label: WHATSAPP_CHANNEL_LABEL, platform: "whatsapp" as const },
    settings.instagram ? { href: settings.instagram, label: "Instagram", platform: "instagram" as const } : null,
    settings.facebook ? { href: settings.facebook, label: "Facebook", platform: "facebook" as const } : null,
    settings.tiktok ? { href: settings.tiktok, label: "TikTok", platform: "tiktok" as const } : null
  ].filter((item): item is { href: string; label: string; platform: "whatsapp" | "instagram" | "facebook" | "tiktok" } => Boolean(item));
}
