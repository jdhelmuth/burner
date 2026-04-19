import { redirect } from "next/navigation";

export default async function OpenInAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;
  const webFallback = token ? `/b/${slug}?token=${token}` : `/b/${slug}`;

  redirect(webFallback);
}
