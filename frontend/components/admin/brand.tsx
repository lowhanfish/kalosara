import Link from "next/link";
import { KalosaraEmblemSvg } from "./admin-icons";

export function AdminBrand() {
  return (
    <Link
      href="/admin"
      className="admin-brand group flex items-center gap-3.5"
      aria-label="KALOSARA — ringkasan admin"
    >
      <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl shadow-md shadow-blue-600/20 transition-transform duration-200 group-hover:scale-105">
        <KalosaraEmblemSvg size={42} />
      </div>
      <span className="admin-brand-name">
        KALOSARA
        <small className="admin-brand-caption">Kelurahan Watundehoa</small>
      </span>
    </Link>
  );
}
