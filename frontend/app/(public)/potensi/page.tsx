import PlaceDirectory from "@/features/community/place-directory";
export const metadata = { title: "Potensi lokal" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PlaceDirectory mode="potentials" searchParams={searchParams} />;
}
