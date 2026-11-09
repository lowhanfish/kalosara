import type { News, List, Category } from "@/features/cms/client";

export type CreateInterface = News;

export type ResponseInterface = Pick<
  News,
  "id" | "title" | "slug" | "status" | "version"
> & {
  category: { name: string };
  updatedAt?: string;
};

export type ResponseListInterface = List<ResponseInterface>;

export type CategoryListInterface = List<Category>;
