"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate } from "@/features/cms/client";
import type {
  CreateInterface,
  UpdateAccessInterface,
  UserItem,
  ResponseListInterface,
} from "../types";

export const useResponseListMaster = (params: {
  tab: "users" | "audit" | "uploads";
  page: number;
  search: string;
  roleFilter: string;
}) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const { tab, page, search, roleFilter } = params;

  const queryUrl =
    tab === "users"
      ? `/admin/dashboard/users?page=${page}&limit=10&search=${encodeURIComponent(search)}${
          roleFilter !== "ALL" ? `&role=${roleFilter}` : ""
        }`
      : tab === "audit"
        ? `/admin/dashboard/audit?page=${page}&limit=10&search=${encodeURIComponent(search)}`
        : `/admin/dashboard/uploads?page=${page}&limit=10&search=${encodeURIComponent(search)}`;

  return useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "management",
      tab,
      page,
      search,
      roleFilter,
    ],
    queryFn: () => runtime.request<ResponseListInterface>(queryUrl),
    staleTime: 0,
  });
};

export const useCreateMaster = (onSuccess?: () => void) => {
  const runtime = useAuthRuntime();

  return useMutation({
    mutationFn: async (body: CreateInterface) => {
      return await cmsMutate<{ item: UserItem }>(
        runtime.request,
        "/admin/dashboard/users",
        body,
        "POST",
      );
    },
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.();
    },
  });
};

export const useUpdateMaster = (userId: string, onSuccess?: () => void) => {
  const runtime = useAuthRuntime();

  return useMutation({
    mutationFn: async (body: UpdateAccessInterface) => {
      try {
        return await cmsMutate(
          runtime.request,
          `/admin/dashboard/users/${userId}/access`,
          body,
          "POST",
        );
      } finally {
        body.currentPassword = "";
        delete body.newPassword;
      }
    },
    onSuccess: async () => {
      await runtime.queryClient.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.();
    },
  });
};
