import Link from "next/link";
import Image from "next/image";
import { siteIdentity } from "@/lib/site-identity";
export function AdminBrand() {
  return (
    <Link
      href="/admin"
      className="admin-brand flex items-center gap-3"
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
      <span className="admin-brand-name">
        KALOSARA
        <small className="admin-brand-caption">Kelurahan Watundehoa</small>
      </span>
    </Link>
  );
}
