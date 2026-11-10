"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { ResponseInterface } from "../types";

export const useResponseMaster = () => {
  const auth = useAuth();
  const runtime = useAuthRuntime();

  return useQuery({
    queryKey: ["user", auth.user?.id, "profile-editor"],
    enabled:
      auth.status === "AUTHENTICATED" &&
      (auth.user?.role === "ADMIN_KELURAHAN" || auth.user?.role === "LURAH"),
    queryFn: () => runtime.request<ResponseInterface>("/admin/profile"),
  });
};
