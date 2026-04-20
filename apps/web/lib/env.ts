export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
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
  isSupabaseConfigured: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  hasDeveloperDonation: Boolean(
    env.developerDonationUrl.trim() ||
      env.developerDonationSecondaryUrl.trim(),
  ),
};
