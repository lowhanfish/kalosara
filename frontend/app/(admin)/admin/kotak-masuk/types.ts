import type { List } from "@/features/cms/client";
import type { CitizenRequest } from "@/lib/community";

export interface CreateInterface {
  status: CitizenRequest["status"];
  internalNote: string;
  expectedVersion: number;
}

export type ResponseInterface = CitizenRequest;
export type ResponseListInterface = List<CitizenRequest>;
