"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate } from "@/features/cms/client";
import type {
  SectionSlug,
  CreateInterface,
  ResponseInterface,
} from "../types";

export const useResponseMaster = (slug: SectionSlug) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();

  return useQuery({
    queryKey: ["user", auth.user?.id, "community-section", slug],
    enabled:
      auth.user?.role === "ADMIN_KELURAHAN" || auth.user?.role === "LURAH",
    queryFn: () =>
      runtime.request<ResponseInterface>(
        `/admin/community/sections/${slug}`,
      ),
  });
};

export const useUpdateMaster = (
  slug: SectionSlug,
  onSuccess?: (version: number) => void,
) => {
  const runtime = useAuthRuntime();

  return useMutation({
    mutationFn: (form: CreateInterface) =>
      cmsMutate<{ version: number }>(
        runtime.request,
        `/admin/community/sections/${slug}`,
        form,
      ),
    onSuccess: (result) => {
      onSuccess?.(result.version);
    },
  });
};
