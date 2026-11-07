import PlaceDetail, { loadPlace } from "@/features/community/place-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PlaceDetail id={(await params).id} kind="facilities" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const item = await loadPlace("facilities", (await params).id);
  return {
    title: item.name,
    description: item.description
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 160),
  };
}
