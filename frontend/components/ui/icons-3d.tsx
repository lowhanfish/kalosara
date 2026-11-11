import type { SVGProps } from "react";

export type Icon3dKey =
  | "anggaran"
  | "ppid"
  | "wisata"
  | "umkm"
  | "fasilitas"
  | "pengaduan"
  | "pelayanan"
  | "dokumen"
  | "agenda"
  | "pengumuman"
  | "galeri"
  | "statistik";

interface Icon3dProps extends SVGProps<SVGSVGElement> {
  name: Icon3dKey;
  size?: number;
}

export function Icon3D({ name, size = 48, className, ...props }: Icon3dProps) {
  const SvgComponent = iconMap[name];
  if (!SvgComponent) return null;
  return (
    <SvgComponent
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    />
  );
}

/* 01. ANGGARAN - 3D Golden Vault & Coin Stack */
function Icon3dAnggaran(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-ang-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-ang-coin1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="g-ang-top1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="g-ang-coin2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      {/* Soft Contact Shadow */}
      <ellipse cx="28" cy="46" rx="20" ry="6" fill="url(#g-ang-shadow)" />
      {/* Bottom Coin Stack Base */}
      <path
        d="M13 34v6c0 4 6.7 7 15 7s15-3 15-7v-6c-2.3 3.2-8.1 5.3-15 5.3s-12.7-2.1-15-5.3z"
        fill="url(#g-ang-coin2)"
      />
      <ellipse cx="28" cy="34" rx="15" ry="6" fill="url(#g-ang-top1)" />
      {/* Middle Coin */}
      <path
        d="M13 26v6c0 4 6.7 7 15 7s15-3 15-7v-6c-2.3 3.2-8.1 5.3-15 5.3s-12.7-2.1-15-5.3z"
        fill="url(#g-ang-coin1)"
      />
      <ellipse cx="28" cy="26" rx="15" ry="6" fill="url(#g-ang-top1)" />
      {/* Top Floating Coin - Angled */}
      <g transform="translate(0, -3)">
        <path
          d="M13 17v5c0 4 6.7 7 15 7s15-3 15-7v-5c-2.3 3.2-8.1 5.3-15 5.3s-12.7-2.1-15-5.3z"
          fill="url(#g-ang-coin1)"
        />
        <ellipse cx="28" cy="17" rx="15" ry="6.2" fill="url(#g-ang-top1)" />
        <ellipse
          cx="28"
          cy="17"
          rx="11"
          ry="4.5"
          fill="#fef08a"
          stroke="#d97706"
          strokeWidth="1"
        />
        {/* Rp / currency symbol embossing */}
        <text
          x="28"
          y="19"
          textAnchor="middle"
          fontSize="7"
          fontWeight="900"
          fill="#b45309"
          fontFamily="system-ui, sans-serif"
        >
          Rp
        </text>
      </g>
      {/* 3D Specular Sparkle */}
      <path
        d="M42 11l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z"
        fill="#fef08a"
        opacity="0.9"
      />
    </svg>
  );
}

/* 02. PPID - 3D Transparency Folder & Light Beam */
function Icon3dPPID(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-ppid-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-ppid-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
        <linearGradient id="g-ppid-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="g-ppid-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-ppid-shadow)" />
      {/* Back Folder Flap */}
      <path
        d="M11 19a3 3 0 0 1 3-3h7l3 3h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V19z"
        fill="url(#g-ppid-back)"
      />
      {/* White Document Emerging */}
      <rect
        x="17"
        y="11"
        width="22"
        height="26"
        rx="2"
        fill="url(#g-ppid-paper)"
        filter="drop-shadow(0 2px 4px #0002)"
      />
      <line
        x1="21"
        y1="17"
        x2="33"
        y2="17"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="22"
        x2="35"
        y2="22"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="26"
        x2="31"
        y2="26"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Front Folder Angled */}
      <path
        d="M9 25a3 3 0 0 1 3-2.5h32a3 3 0 0 1 3 2.5l-2.5 17a3 3 0 0 1-3 2.5H14.5a3 3 0 0 1-3-2.5L9 25z"
        fill="url(#g-ppid-front)"
        opacity="0.95"
      />
      {/* Floating Magnifier / Shield Eye */}
      <circle
        cx="28"
        cy="33"
        r="6"
        fill="#ffffff33"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <circle cx="28" cy="33" r="2.5" fill="#fef08a" />
    </svg>
  );
}

/* 03. WISATA - 3D Emerald Mountain & Sun Prism */
function Icon3dWisata(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-wis-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-wis-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="g-wis-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="g-wis-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="20" ry="6" fill="url(#g-wis-shadow)" />
      {/* 3D Sun Disc Rising */}
      <circle cx="37" cy="17" r="8" fill="url(#g-wis-sun)" />
      <circle
        cx="37"
        cy="17"
        r="10"
        stroke="#fde047"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.6"
      />
      {/* Small Peak in background */}
      <polygon points="12,42 22,23 32,42" fill="#047857" opacity="0.8" />
      <polygon points="22,23 32,42 27,42" fill="#065f46" opacity="0.9" />
      {/* Main 3D Mountain Peak */}
      <polygon points="26,14 11,43 27,43" fill="url(#g-wis-left)" />
      <polygon points="26,14 43,43 27,43" fill="url(#g-wis-right)" />
      {/* Snow/Light Crest */}
      <polygon points="26,14 22,22 26,24 29,21" fill="#ecfdf5" />
      <polygon points="26,14 29,21 33,23 26,24" fill="#a7f3d0" />
      {/* Winding Trail */}
      <path
        d="M26 24q-2 8 2 11t-1 8"
        stroke="#fde047"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}

/* 04. UMKM - 3D Gift / Retail Package with Gold Ribbon */
function Icon3dUMKM(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-umkm-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-umkm-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="g-umkm-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="g-umkm-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#9a3412" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="18" ry="5.5" fill="url(#g-umkm-shadow)" />
      {/* Isometric Box - Left Face */}
      <polygon points="12,23 28,32 28,45 12,36" fill="url(#g-umkm-left)" />
      {/* Isometric Box - Right Face */}
      <polygon points="28,32 44,23 44,36 28,45" fill="url(#g-umkm-right)" />
      {/* Isometric Box - Top Face */}
      <polygon points="28,15 44,23 28,32 12,23" fill="url(#g-umkm-top)" />
      {/* Vertical Ribbon Left */}
      <polygon points="18,26.5 22,28.8 22,41.5 18,39.5" fill="#fde047" />
      {/* Vertical Ribbon Right */}
      <polygon points="34,28.8 38,26.5 38,39.5 34,41.5" fill="#eab308" />
      {/* Top Ribbon Cross */}
      <polygon points="20,19 24,21 24,27 20,25" fill="#fef08a" />
      <polygon points="32,21 36,19 36,25 32,27" fill="#fef08a" />
      {/* 3D Ribbon Bow knot on top */}
      <ellipse
        cx="24"
        cy="13"
        rx="4"
        ry="2.5"
        transform="rotate(-25 24 13)"
        fill="#fde047"
        stroke="#ca8a04"
        strokeWidth="1"
      />
      <ellipse
        cx="32"
        cy="13"
        rx="4"
        ry="2.5"
        transform="rotate(25 32 13)"
        fill="#fde047"
        stroke="#ca8a04"
        strokeWidth="1"
      />
      <circle
        cx="28"
        cy="14"
        r="2.5"
        fill="#fef9c3"
        stroke="#ca8a04"
        strokeWidth="1"
      />
    </svg>
  );
}

/* 05. PETA FASILITAS - 3D Isometric Map Slab & Pin Marker */
function Icon3dFasilitas(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-fas-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#047857" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#047857" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-fas-pin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-fas-shadow)" />
      {/* 3D Map Slab Isometric Top */}
      <polygon
        points="28,21 45,29 28,38 11,29"
        fill="#e2e8f0"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      {/* Slab Thickness / Depth */}
      <polygon points="11,29 28,38 28,42 11,33" fill="#64748b" />
      <polygon points="28,38 45,29 45,33 28,42" fill="#475569" />
      {/* Map Roads on Slab */}
      <path
        d="M19 25l13 8m-4-10l-6 10"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M25 24l8 6"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Pin Contact Shadow */}
      <ellipse cx="28" cy="33" rx="4.5" ry="2" fill="#0f172a" opacity="0.4" />
      {/* 3D Floating Location Pin */}
      <g transform="translate(0, -6)">
        <path
          d="M28 35c-4.5-5.5-8-9.5-8-14a8 8 0 1 1 16 0c0 4.5-3.5 8.5-8 14z"
          fill="url(#g-fas-pin)"
          filter="drop-shadow(0 3px 6px #0003)"
        />
        <circle cx="28" cy="21" r="3" fill="#ffffff" />
      </g>
    </svg>
  );
}

/* 06. PENGADUAN - 3D Horn Megaphone & Soundwaves */
function Icon3dPengaduan(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-peng-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-peng-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="60%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-peng-shadow)" />
      {/* Handle */}
      <path
        d="M22 30l-3 9a2 2 0 0 0 2 2.5l2 .5a2 2 0 0 0 2-1.5l2.5-9"
        fill="#0f172a"
      />
      {/* Megaphone Cone Body */}
      <path
        d="M16 23l16-9v20l-16-5a2 2 0 0 1-1.5-2v-2a2 2 0 0 1 1.5-2z"
        fill="url(#g-peng-body)"
      />
      {/* Rear Cap */}
      <ellipse cx="16" cy="24" rx="2" ry="4" fill="#f43f5e" />
      {/* Front Bell Rim Ellipse */}
      <ellipse
        cx="32"
        cy="24"
        rx="3.5"
        ry="10"
        fill="#fde047"
        stroke="#b45309"
        strokeWidth="1"
      />
      <ellipse cx="32" cy="24" rx="2" ry="7" fill="#78350f" />
      {/* 3D Soundwaves / Audio Arcs */}
      <path
        d="M38 18a8 8 0 0 1 0 12"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M43 14a14 14 0 0 1 0 20"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
}

/* 07. PELAYANAN - 3D Royal Shield & Checkmark Pedestal */
function Icon3dPelayanan(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-pel-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-pel-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="60%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="g-pel-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-pel-shadow)" />
      {/* 3D Shield Base */}
      <path
        d="M28 10L14 15v13c0 9 6 15 14 17 8-2 14-8 14-17V15L28 10z"
        fill="url(#g-pel-shield)"
        filter="drop-shadow(0 4px 8px #0003)"
      />
      {/* Inner Beveled Rim */}
      <path
        d="M28 13L17 17.5v10c0 7 4.7 12 11 13.5 6.3-1.5 11-6.5 11-13.5v-10L28 13z"
        stroke="url(#g-pel-gold)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Floating 3D Checkmark */}
      <path
        d="M22 26l4.5 4.5 9-9"
        stroke="#fde047"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 2px 4px #0004)"
      />
    </svg>
  );
}

/* 08. INFORMASI PUBLIK - 3D Stacked Dossiers & Seal */
function Icon3dDokumen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-dok-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-dok-book" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-dok-shadow)" />
      {/* Bottom Binder */}
      <polygon points="12,38 28,44 44,38 28,32" fill="#cbd5e1" />
      <polygon points="12,38 28,44 28,47 12,41" fill="#475569" />
      <polygon points="28,44 44,38 44,41 28,47" fill="#334155" />
      {/* Middle Document */}
      <polygon points="12,30 28,36 44,30 28,24" fill="#f8fafc" />
      <polygon points="12,30 28,36 28,33 12,27" fill="#94a3b8" />
      <polygon points="28,36 44,30 44,27 28,33" fill="#64748b" />
      {/* Top Main Folder */}
      <polygon points="12,21 28,27 44,21 28,15" fill="url(#g-dok-book)" />
      <polygon points="12,21 28,27 28,24 12,18" fill="#0f766e" />
      <polygon points="28,27 44,21 44,18 28,24" fill="#115e59" />
      {/* Golden Seal Medallion */}
      <circle
        cx="28"
        cy="20"
        r="5"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle cx="28" cy="20" r="2.5" fill="#fef08a" />
      {/* Floating Ribbon Bookmark */}
      <path d="M35 18v14l3-2.5 3 2.5V18" fill="#f43f5e" />
    </svg>
  );
}

/* 09. AGENDA - 3D Isometric Calendar Block */
function Icon3dAgenda(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-agd-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7e22ce" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-agd-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3e8ff" />
        </linearGradient>
        <linearGradient id="g-agd-side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-agd-shadow)" />
      {/* Isometric Calendar Cube - Left */}
      <polygon points="13,24 28,32 28,44 13,36" fill="url(#g-agd-side)" />
      {/* Isometric Calendar Cube - Right */}
      <polygon points="28,32 43,24 43,36 28,44" fill="#6b21a8" />
      {/* Top Face */}
      <polygon
        points="28,16 43,24 28,32 13,24"
        fill="url(#g-agd-top)"
        stroke="#e9d5ff"
        strokeWidth="1"
      />
      {/* Red Calendar Header Bar */}
      <polygon points="13,24 28,32 28,29 13,21" fill="#ec4899" />
      <polygon points="28,32 43,24 43,21 28,29" fill="#db2777" />
      {/* Binder Metal Rings */}
      <circle
        cx="21"
        cy="19"
        r="1.5"
        fill="#475569"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      <circle
        cx="28"
        cy="22.5"
        r="1.5"
        fill="#475569"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      <circle
        cx="35"
        cy="19"
        r="1.5"
        fill="#475569"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      {/* Floating Day Number Badge */}
      <g transform="translate(0, -3)">
        <circle
          cx="36"
          cy="14"
          r="5"
          fill="#fbbf24"
          stroke="#ffffff"
          strokeWidth="1.5"
          filter="drop-shadow(0 2px 4px #0003)"
        />
        <text
          x="36"
          y="16.5"
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="900"
          fill="#78350f"
          fontFamily="system-ui, sans-serif"
        >
          28
        </text>
      </g>
    </svg>
  );
}

/* 10. PENGUMUMAN - 3D Golden Broadcast Bell */
function Icon3dPengumuman(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-bell-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-bell-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-bell-shadow)" />
      {/* Top Bell Loop */}
      <circle
        cx="28"
        cy="14"
        r="4"
        fill="none"
        stroke="#d97706"
        strokeWidth="2"
      />
      {/* Bell Body */}
      <path
        d="M28 15c-6.5 0-11 5-11 15 0 3-1.5 5-3 6.5h28c-1.5-1.5-3-3.5-3-6.5 0-10-4.5-15-11-15z"
        fill="url(#g-bell-gold)"
        filter="drop-shadow(0 4px 6px #0003)"
      />
      {/* Bottom Rim Lip */}
      <ellipse
        cx="28"
        cy="37"
        rx="14"
        ry="3.5"
        fill="#fde047"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Clapper Ball */}
      <circle cx="28" cy="41" r="3" fill="#78350f" />
      {/* Sparkles */}
      <path d="M12 18l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fde047" />
      <path d="M42 22l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fde047" />
    </svg>
  );
}

/* 11. GALERI - 3D Isometric Camera Prism */
function Icon3dGaleri(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-cam-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-cam-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="g-cam-lens" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="60%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-cam-shadow)" />
      {/* 3D Camera Body */}
      <rect
        x="11"
        y="21"
        width="34"
        height="22"
        rx="5"
        fill="url(#g-cam-body)"
        filter="drop-shadow(0 4px 8px #0004)"
      />
      {/* Top Viewfinder Bump */}
      <path d="M22 21l2-4h8l2 4" fill="#1e293b" />
      {/* Flash Gem */}
      <circle cx="39" cy="26" r="2" fill="#fde047" />
      {/* 3D Big Lens Outer Ring */}
      <circle
        cx="28"
        cy="32"
        r="9"
        fill="#1e293b"
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />
      {/* Lens Glass with Prismatic Glow */}
      <circle cx="28" cy="32" r="6.5" fill="url(#g-cam-lens)" />
      {/* Lens Specular Reflection */}
      <ellipse
        cx="26"
        cy="30"
        rx="2.5"
        ry="1.5"
        fill="#ffffff"
        opacity="0.7"
        transform="rotate(-30 26 30)"
      />
    </svg>
  );
}

/* 12. STATISTIK - 3D Tiered Data Pillars & Growth Arrow */
function Icon3dStatistik(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props}>
      <defs>
        <radialGradient id="g-stat-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-stat-bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="g-stat-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="g-stat-bar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="46" rx="19" ry="5.5" fill="url(#g-stat-shadow)" />
      {/* Bar 1 (Low) */}
      <path
        d="M12 33v9c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-9z"
        fill="url(#g-stat-bar1)"
      />
      <ellipse cx="20" cy="33" rx="8" ry="3" fill="#bae6fd" />
      {/* Bar 2 (Medium) */}
      <path
        d="M22 25v17c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-17z"
        fill="url(#g-stat-bar2)"
      />
      <ellipse cx="30" cy="25" rx="8" ry="3" fill="#bfdbfe" />
      {/* Bar 3 (High) */}
      <path
        d="M32 17v25c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-25z"
        fill="url(#g-stat-bar3)"
      />
      <ellipse cx="40" cy="17" rx="8" ry="3" fill="#c7d2fe" />
      {/* 3D Floating Trend Arrow */}
      <path
        d="M14 26l11-8 8 4 9-9"
        fill="none"
        stroke="#fde047"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 2px 4px #0004)"
      />
      <polygon points="42,13 42,19 36,13" fill="#fde047" />
    </svg>
  );
}

const iconMap: Record<
  Icon3dKey,
  (props: SVGProps<SVGSVGElement>) => React.JSX.Element
> = {
  anggaran: Icon3dAnggaran,
  ppid: Icon3dPPID,
  wisata: Icon3dWisata,
  umkm: Icon3dUMKM,
  fasilitas: Icon3dFasilitas,
  pengaduan: Icon3dPengaduan,
  pelayanan: Icon3dPelayanan,
  dokumen: Icon3dDokumen,
  agenda: Icon3dAgenda,
  pengumuman: Icon3dPengumuman,
  galeri: Icon3dGaleri,
  statistik: Icon3dStatistik,
};
