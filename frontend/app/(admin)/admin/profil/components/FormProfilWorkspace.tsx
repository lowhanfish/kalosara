"use client";

import Editor from "@/features/admin/profile/editor";
import type { ResponseInterface } from "../types";

export function FormProfilWorkspace({
  data,
  reload,
}: {
  data: ResponseInterface;
  reload: () => void;
}) {
  return <Editor data={data} reload={reload} />;
}
