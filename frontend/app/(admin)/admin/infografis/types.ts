import type { SectionSlug, CommunitySection } from "@/lib/community";

export type { SectionSlug };
export type CreateInterface = CommunitySection;
export type ResponseInterface = { section: CommunitySection | null };
