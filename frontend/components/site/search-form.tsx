import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function SearchForm({
  id = "site-search",
  defaultValue = "",
}: {
  id?: string;
  defaultValue?: string;
}) {
  return (
    <form action="/pencarian" role="search" className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        Cari halaman di KALOSARA
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="q"
          type="search"
          maxLength={100}
          defaultValue={defaultValue}
          placeholder="Contoh: pelayanan, kontak…"
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="icon" aria-label="Cari halaman">
          <Search aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </form>
  );
}
