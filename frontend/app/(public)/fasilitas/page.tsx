import PlaceDirectory from "@/features/community/place-directory";
export const metadata = { title: "Fasilitas publik" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PlaceDirectory mode="facilities" searchParams={searchParams} />;
}
