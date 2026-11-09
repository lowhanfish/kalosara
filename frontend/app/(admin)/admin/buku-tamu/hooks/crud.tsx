"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import { cmsMutate } from "@/features/cms/client";
import type {
  GuestBookItem,
  GuestBookListResponse,
  GuestBookStats,
  GuestStatus,
  GuestType,
} from "../types";

export interface GuestBookFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: GuestStatus | "";
  guestType?: GuestType | "";
  date?: string;
  month?: string;
  year?: string;
}

export function useGuestBookList(params: GuestBookFilterParams) {
  const auth = useAuth();
  const runtime = useAuthRuntime();

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.search) queryParams.set("search", params.search.trim());
  if (params.status) queryParams.set("status", params.status);
  if (params.guestType) queryParams.set("guestType", params.guestType);
  if (params.date) queryParams.set("date", params.date);
  if (params.month) queryParams.set("month", params.month);
  if (params.year) queryParams.set("year", params.year);

  const isStaff =
    auth.user?.role === "ADMIN_KELURAHAN" || auth.user?.role === "LURAH";

  return useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "guestbook-list",
      params.page,
      params.limit,
      params.search,
      params.status,
      params.guestType,
      params.date,
      params.month,
      params.year,
    ],
    enabled: isStaff,
    queryFn: () =>
      runtime.request<GuestBookListResponse>(
        `/admin/guestbook?${queryParams.toString()}`,
      ),
  });
}

export function useGuestBookStats() {
  const auth = useAuth();
  const runtime = useAuthRuntime();

  const isStaff =
    auth.user?.role === "ADMIN_KELURAHAN" || auth.user?.role === "LURAH";

  return useQuery({
    queryKey: ["user", auth.user?.id, "guestbook-stats"],
    enabled: isStaff,
    queryFn: () => runtime.request<GuestBookStats>("/admin/guestbook/stats"),
  });
}

export function useGuestBookDetail(id: string) {
  const auth = useAuth();
  const runtime = useAuthRuntime();

  const isStaff =
    auth.user?.role === "ADMIN_KELURAHAN" || auth.user?.role === "LURAH";

  return useQuery({
    queryKey: ["user", auth.user?.id, "guestbook-detail", id],
    enabled: !!id && isStaff,
    queryFn: () => runtime.request<GuestBookItem>(`/admin/guestbook/${id}`),
  });
}

export function useUpdateGuestBookStatus(onSuccess?: () => void) {
  const runtime = useAuthRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      internalNote,
      servedBy,
    }: {
      id: string;
      status: GuestStatus;
      internalNote?: string;
      servedBy?: string;
    }) =>
      cmsMutate<GuestBookItem>(
        runtime.request,
        `/admin/guestbook/${id}/status`,
        { status, internalNote, servedBy },
        "PATCH",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onSuccess?.();
    },
  });
}
