export const env = {
  burnerAppUrl: process.env.NEXT_PUBLIC_BURNER_APP_URL ?? "burner://",
  webOrigin: process.env.NEXT_PUBLIC_WEB_ORIGIN ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  developerDonationUrl:
    process.env.NEXT_PUBLIC_DEVELOPER_DONATION_URL ??
    "https://buymeacoffee.com/jdhelmuth",
  developerDonationLabel:
    process.env.NEXT_PUBLIC_DEVELOPER_DONATION_LABEL ??
    "Buy me a coffee",
  developerDonationSecondaryUrl:
    process.env.NEXT_PUBLIC_DEVELOPER_DONATION_SECONDARY_URL ?? "",
  developerDonationSecondaryLabel:
    process.env.NEXT_PUBLIC_DEVELOPER_DONATION_SECONDARY_LABEL ?? "",
  developerDonationMessage:
    process.env.NEXT_PUBLIC_DEVELOPER_DONATION_MESSAGE ??
    "If you had fun with this, consider donating!",
};

export const runtimeFlags = {
  isBackendConfigured: process.env.NEXT_PUBLIC_DISABLE_BACKEND !== "true",
  hasDeveloperDonation: Boolean(
    env.developerDonationUrl.trim() ||
      env.developerDonationSecondaryUrl.trim(),
  ),
};
