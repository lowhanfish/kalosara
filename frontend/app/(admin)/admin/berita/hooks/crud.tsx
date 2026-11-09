"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, useAuthRuntime } from "@/features/auth/auth-provider";
import type { News } from "@/features/cms/client";
import type { ResponseListInterface, CategoryListInterface } from "../types";

export const useResponseListMaster = (params: {
  page: number;
  limit?: number;
  search: string;
  status: string;
  sort: string;
  categoryId: string;
}) => {
  const auth = useAuth();
  const runtime = useAuthRuntime();
  const { page, search, status, sort, categoryId } = params;

  return useQuery({
    queryKey: [
      "user",
      auth.user?.id,
      "cms-news",
      page,
      search,
      status,
      sort,
      categoryId,
    ],
    queryFn: () =>
      runtime.request<ResponseListInterface>(
        `/admin/news?page=${page}&search=${encodeURIComponent(search)}&sort=${sort}${status ? `&status=${status}` : ""}${categoryId ? `&categoryId=${categoryId}` : ""}`,
      ),
  });
};

export const useResponseOption = () => {
  const auth = useAuth();
  const runtime = useAuthRuntime();

  return useQuery({
    queryKey: ["user", auth.user?.id, "cms-categories", "filter"],
    queryFn: () =>
      runtime.request<CategoryListInterface>("/admin/news/categories?limit=50"),
  });
};

export const useResponseDetailMaster = (onSuccess?: (news: News) => void) => {
  const runtime = useAuthRuntime();

  return useMutation({
    mutationFn: (id: string) =>
      runtime.request<{ news: News }>(`/admin/news/${id}`),
    onSuccess: (data) => {
      onSuccess?.(data.news);
    },
  });
};
