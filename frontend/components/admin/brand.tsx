import Link from "next/link";
import Image from "next/image";
import { siteIdentity } from "@/lib/site-identity";
export function AdminBrand() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-3"
      aria-label="KALOSARA — ringkasan admin"
    >
      <Image
        src={siteIdentity.logo}
        alt=""
        width={36}
        height={42}
        unoptimized
        className="h-10 w-9 object-contain"
      />
      <span className="text-lg font-extrabold tracking-[.14em] text-white">
        KALOSARA
        <small className="mt-1 block text-xs font-medium tracking-[.19em] text-slate-400">
          PANEL KELOLA KELURAHAN
        </small>
      </span>
    </Link>
  );
}
