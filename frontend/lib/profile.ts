export type ProfilePage = {
  slug: string;
  title: string;
  content: string;
  status: string;
};
export type Official = {
  id: string;
  name: string;
  position: string;
  unit: string;
  sortOrder: number;
  photoUrl: string | null;
  active: boolean;
  termStart: string | null;
  termEnd: string | null;
  status: string;
};
export async function getPublicProfile(): Promise<{
  pages: ProfilePage[];
  officials: Official[];
  unavailable?: boolean;
}> {
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/profile`,
      { cache: "no-store", signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) throw new Error("Profile unavailable");
    const body = await response.json();
    if (body.success !== true) throw new Error("Invalid profile");
    return body.data;
  } catch {
    return { pages: [], officials: [], unavailable: true };
  }
}
