"use client";

import Editor from "@/features/admin/services/editor";
import type { ProfilePage } from "@/lib/profile";

export function FormPelayananWorkspace({ page }: { page?: ProfilePage }) {
  return <Editor page={page} />;
}
