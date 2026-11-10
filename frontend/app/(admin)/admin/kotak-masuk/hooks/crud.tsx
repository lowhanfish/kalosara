"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate } from "@/features/cms/client";
import type {
  CreateInterface,
  ResponseInterface,
  ResponseListInterface,
} from "../types";

export const useResponseListMaster = (params: {
  page: number;
  kind: string;
  status: string;
}) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const { page, kind, status } = params;

  return useQuery({
    queryKey: ["user", auth.user?.id, "community-inbox", page, kind, status],
    enabled:
      auth.user?.role === "ADMIN_KELURAHAN" || auth.user?.role === "LURAH",
    queryFn: () =>
      runtime.request<ResponseListInterface>(
        `/admin/community/requests?${new URLSearchParams({
          page: String(page),
          ...(kind ? { kind } : {}),
          ...(status ? { status } : {}),
        })}`,
      ),
  });
};

export const useResponseDetailMaster = (selectedId: string) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();

  return useQuery({
    queryKey: ["user", auth.user?.id, "community-request", selectedId],
    enabled:
      !!selectedId &&
      (auth.user?.role === "ADMIN_KELURAHAN" || auth.user?.role === "LURAH"),
    queryFn: () =>
      runtime.request<{ item: ResponseInterface }>(
        `/admin/community/requests/${selectedId}`,
      ),
  });
};

export const useUpdateMaster = (
  id: string,
  onSuccess?: (version: number) => void,
) => {
  const runtime = useAuthRuntime();

  return useMutation({
    mutationFn: (payload: CreateInterface) =>
      cmsMutate<{ version: number }>(
        runtime.request,
        `/admin/community/requests/${id}`,
        payload,
        "PATCH",
      ),
    onSuccess: (r) => {
      onSuccess?.(r.version);
    },
  });
};
