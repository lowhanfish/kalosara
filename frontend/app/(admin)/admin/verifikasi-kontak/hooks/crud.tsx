"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { accountMutation } from "@/features/account/client";
import type { ResponseListInterface } from "../types";

export const useResponseListMaster = (params: {
  page: number;
  search: string;
}) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const { page, search } = params;

  return useQuery({
    queryKey: ["user", auth.user?.id, "contact-reviews", page, search],
    queryFn: () =>
      runtime.request<ResponseListInterface>(
        `/admin/contact-changes?page=${page}&search=${encodeURIComponent(search)}`,
      ),
  });
};

export const useUpdateMaster = (id: string, onSuccess?: () => void) => {
  const runtime = useAuthRuntime();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      accountMutation(
        runtime.request,
        `/admin/contact-changes/${id}/review`,
        body,
      ),
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.();
    },
  });
};
