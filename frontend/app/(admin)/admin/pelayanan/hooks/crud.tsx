"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { ResponseInterface } from "../types";

export const useResponseMaster = () => {
  const auth = useAuth();
  const { request } = useAuthRuntime();

  return useQuery({
    queryKey: ["user", auth.user?.id, "service-page"],
    queryFn: () => request<ResponseInterface>("/admin/profile"),
  });
};
