"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { Kind, ResponseListInterface } from "../types";

export const useResponseListMaster = (params: {
  kind: Kind;
  page: number;
  search: string;
  status: string;
  category: string;
}) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const { kind, page, search, status, category } = params;

  return useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "region",
      kind,
      page,
      search,
      status,
      category,
    ],
    queryFn: () =>
      runtime.request<ResponseListInterface>(
        `/admin/region/${kind}?page=${page}&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}${kind === "potentials" && category ? `&category=${encodeURIComponent(category)}` : ""}`,
      ),
  });
};
