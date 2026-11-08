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
export type PublicProfile = {
  pages: ProfilePage[];
  officials: Official[];
  unavailable?: boolean;
};

export async function getPublicProfile(): Promise<PublicProfile> {
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/public/profile`,
      {
        next: { revalidate: 60, tags: ["public-profile"] },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) throw new Error("Profile unavailable");
    const body = await response.json();
    if (body.success !== true) throw new Error("Invalid profile");
    return body.data;
  } catch {
    return { pages: [], officials: [], unavailable: true };
  }
}
