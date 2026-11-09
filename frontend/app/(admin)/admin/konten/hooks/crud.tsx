"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { ContentKind, ResponseListInterface } from "../types";

export const useResponseListMaster = (params: {
  kind: ContentKind;
  page: number;
  search: string;
  status: string;
}) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const { kind, page, search, status } = params;

  return useQuery({
    queryKey: ["user", auth.user?.id, "content", kind, page, search, status],
    queryFn: () =>
      runtime.request<ResponseListInterface>(
        `/admin/content/${kind}?page=${page}&search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`,
      ),
  });
};
