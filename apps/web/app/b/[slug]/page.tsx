import { ReceiverPageClient } from "../../../components/receiver-page-client";

export default async function BurnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string; payload?: string }>;
}) {
  const { slug } = await params;
  const { token, payload } = await searchParams;

  return <ReceiverPageClient payload={payload} slug={slug} token={token} />;
}
