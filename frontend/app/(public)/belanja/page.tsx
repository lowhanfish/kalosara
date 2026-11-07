import PlaceDirectory from "@/features/community/place-directory";
export const metadata = { title: "Beli dari kelurahan" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PlaceDirectory mode="products" searchParams={searchParams} />;
}
