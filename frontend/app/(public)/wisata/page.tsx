import PlaceDirectory from "@/features/community/place-directory";
export const metadata = { title: "Wisata" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PlaceDirectory mode="tourism" searchParams={searchParams} />;
}
