import React from "react";
import type { LetterType } from "./types";

/**
 * 3D/Isometric styled vector illustrations matching the user's reference image from Desa Namu.
 */
export function LetterIllustratedIcon({
  type,
  className = "w-28 h-28",
}: {
  type: LetterType;
  className?: string;
}) {
  switch (type) {
    case "SKTM":
      // Simple wooden home with cozy nature
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="140" rx="60" ry="12" fill="#0f172a" fillOpacity="0.1" />
          <path d="M40 135L35 120H125L120 135H40Z" fill="#15803d" />
          {/* Wooden Shack Body */}
          <rect x="44" y="75" width="72" height="52" rx="4" fill="#b45309" />
          <path d="M44 85H116M44 97H116M44 109H116" stroke="#78350f" strokeWidth="2" strokeDasharray="4 2" />
          {/* Wood Planks Details */}
          <rect x="52" y="85" width="16" height="22" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />
          <path d="M60 85V107M52 96H68" stroke="#92400e" strokeWidth="1.5" />
          <rect x="84" y="90" width="22" height="37" fill="#78350f" rx="1" />
          <circle cx="101" cy="108" r="2" fill="#fbbf24" />
          {/* Thatched / Rustic Roof */}
          <path d="M28 80L80 40L132 80L125 86L80 48L35 86L28 80Z" fill="#92400e" />
          <path d="M35 78L80 44L125 78L120 84L80 48L40 84L35 78Z" fill="#b45309" />
          {/* Little green plant */}
          <path d="M32 130C32 122 38 120 42 120C42 128 36 130 32 130Z" fill="#22c55e" />
          <path d="M128 130C128 122 122 120 118 120C118 128 124 130 128 130Z" fill="#22c55e" />
        </svg>
      );

    case "SKU":
      // Market booth / UMKM Kiosk with awning & produce
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="142" rx="64" ry="12" fill="#0f172a" fillOpacity="0.12" />
          {/* Kiosk Base */}
          <rect x="38" y="84" width="84" height="48" rx="4" fill="#0284c7" />
          <rect x="42" y="94" width="76" height="34" rx="2" fill="#f0f9ff" />
          {/* Wooden Counter */}
          <rect x="34" y="80" width="92" height="8" rx="2" fill="#d97706" />
          {/* Striped Awning */}
          <path d="M28 50L34 80H126L132 50H28Z" fill="#ef4444" />
          <path d="M42 50L46 80H60L56 50H42Z" fill="#ffffff" />
          <path d="M70 50L72 80H88L86 50H70Z" fill="#ffffff" />
          <path d="M98 50L98 80H112L114 50H98Z" fill="#ffffff" />
          <path d="M28 80C28 84 31 87 34 87C37 87 40 84 40 80C40 84 43 87 46 87C49 87 52 84 52 80C52 84 55 87 58 87C61 87 64 84 64 80C64 84 67 87 70 87C73 87 76 84 76 80C76 84 79 87 82 87C85 87 88 84 88 80C88 84 91 87 94 87C97 87 100 84 100 80C100 84 103 87 106 87C109 87 112 84 112 80C112 84 115 87 118 87C121 87 124 84 124 80C124 84 127 87 130 87C133 87 136 84 136 80H28Z" fill="#dc2626" />
          {/* Shop Sign */}
          <rect x="54" y="32" width="52" height="18" rx="3" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
          <text x="80" y="45" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="900" fontFamily="sans-serif">TOKO</text>
          {/* Goods on shelf */}
          <circle cx="56" cy="108" r="6" fill="#10b981" />
          <circle cx="72" cy="108" r="6" fill="#f59e0b" />
          <circle cx="88" cy="108" r="6" fill="#ef4444" />
          <circle cx="104" cy="108" r="6" fill="#6366f1" />
        </svg>
      );

    case "DOMISILI":
      // Cheerful residential village house
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="138" rx="58" ry="12" fill="#0f172a" fillOpacity="0.1" />
          {/* House walls */}
          <rect x="42" y="74" width="76" height="56" rx="4" fill="#ffedd5" stroke="#ea580c" strokeWidth="2" />
          {/* Roof */}
          <path d="M28 76L80 34L132 76H28Z" fill="#ea580c" />
          <path d="M36 74L80 39L124 74H36Z" fill="#f97316" />
          {/* Chimney */}
          <rect x="98" y="36" width="12" height="20" fill="#9a3412" />
          <path d="M96 36H112" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
          {/* Door */}
          <rect x="70" y="92" width="20" height="38" rx="2" fill="#7c2d12" />
          <circle cx="85" cy="112" r="2" fill="#fbbf24" />
          {/* Windows */}
          <rect x="48" y="86" width="16" height="18" rx="2" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
          <path d="M56 86V104M48 95H64" stroke="#0284c7" strokeWidth="1.5" />
          <rect x="96" y="86" width="16" height="18" rx="2" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
          <path d="M104 86V104M96 95H112" stroke="#0284c7" strokeWidth="1.5" />
          {/* Map Pin Badge */}
          <g transform="translate(108, 20)">
            <circle cx="16" cy="16" r="16" fill="#ef4444" />
            <circle cx="16" cy="14" r="6" fill="#ffffff" />
            <path d="M16 30L12 24H20L16 30Z" fill="#ef4444" />
          </g>
        </svg>
      );

    case "PENGANTAR_SKCK":
      // Security / Good conduct golden shield with star
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="140" rx="48" ry="10" fill="#0f172a" fillOpacity="0.12" />
          {/* Shield Outer */}
          <path d="M80 24L126 44V84C126 112 106 132 80 140C54 132 34 112 34 84V44L80 24Z" fill="url(#shieldGrad)" stroke="#1e3a8a" strokeWidth="3" />
          {/* Shield Inner */}
          <path d="M80 34L116 51V84C116 106 100 122 80 128C60 122 44 106 44 84V51L80 34Z" fill="#0284c7" fillOpacity="0.15" />
          {/* Golden Star */}
          <path d="M80 52L86 68H103L89 78L94 94L80 84L66 94L71 78L57 68H74L80 52Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
          {/* Ribbon */}
          <path d="M42 110L80 122L118 110V122L80 134L42 122V110Z" fill="#1e3a8a" />
          <defs>
            <linearGradient id="shieldGrad" x1="80" y1="24" x2="80" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "BELUM_MENIKAH":
      // Cute golden rings with single heart & dove
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="138" rx="46" ry="10" fill="#0f172a" fillOpacity="0.1" />
          {/* Golden Ring */}
          <ellipse cx="80" cy="88" rx="36" ry="36" stroke="url(#goldGrad)" strokeWidth="14" fill="none" />
          {/* Diamond Top */}
          <path d="M80 36L92 50L80 62L68 50L80 36Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
          <path d="M74 46L80 38L86 46M80 38V60" stroke="#bae6fd" strokeWidth="1.5" />
          {/* Single Heart Badge */}
          <circle cx="114" cy="54" r="16" fill="#f43f5e" />
          <path d="M114 62C114 62 106 56 106 50C106 46 109 44 112 44C113.5 44 114 46 114 46C114 46 114.5 44 116 44C119 44 122 46 122 50C122 56 114 62 114 62Z" fill="#ffffff" />
          <defs>
            <linearGradient id="goldGrad" x1="44" y1="52" x2="116" y2="124" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "BELUM_BEKERJA":
      // Job application briefcase & magnifying glass
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="138" rx="54" ry="10" fill="#0f172a" fillOpacity="0.1" />
          {/* Briefcase */}
          <rect x="36" y="66" width="88" height="58" rx="8" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
          <rect x="36" y="66" width="88" height="24" rx="4" fill="#334155" />
          {/* Handle */}
          <path d="M62 66V50C62 46 66 42 70 42H90C94 42 98 46 98 50V66" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Golden Locks */}
          <rect x="52" y="84" width="8" height="12" rx="2" fill="#fbbf24" />
          <rect x="100" y="84" width="8" height="12" rx="2" fill="#fbbf24" />
          {/* "Need Work" badge */}
          <rect x="58" y="100" width="44" height="14" rx="4" fill="#ef4444" />
          <text x="80" y="110" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">SEEKING</text>
          {/* Magnifying Glass */}
          <g transform="translate(86, 26)">
            <circle cx="24" cy="24" r="16" fill="#e0f2fe" stroke="#0284c7" strokeWidth="4" />
            <path d="M36 36L48 48" stroke="#0369a1" strokeWidth="6" strokeLinecap="round" />
          </g>
        </svg>
      );

    case "PENGHASILAN":
      // Financial statement & stacks of coins
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="140" rx="56" ry="10" fill="#0f172a" fillOpacity="0.1" />
          {/* Paper Sheet */}
          <rect x="40" y="34" width="64" height="86" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          <path d="M50 48H86M50 60H94M50 72H80M50 84H90" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 98H74" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
          {/* Coin stack 1 */}
          <ellipse cx="98" cy="122" rx="18" ry="7" fill="#f59e0b" />
          <rect x="80" y="112" width="36" height="10" fill="#fbbf24" />
          <ellipse cx="98" cy="112" rx="18" ry="7" fill="#fef08a" />
          <rect x="80" y="102" width="36" height="10" fill="#f59e0b" />
          <ellipse cx="98" cy="102" rx="18" ry="7" fill="#fbbf24" />
          <rect x="80" y="92" width="36" height="10" fill="#d97706" />
          <ellipse cx="98" cy="92" rx="18" ry="7" fill="#fef08a" />
          {/* Rp tag */}
          <circle cx="118" cy="74" r="14" fill="#10b981" />
          <text x="118" y="79" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Rp</text>
        </svg>
      );

    case "PENGANTAR_NIKAH":
      // Two loving doves with wedding arch & olive branch
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="140" rx="52" ry="10" fill="#0f172a" fillOpacity="0.1" />
          {/* Floral Arch */}
          <path d="M38 135C38 60 122 60 122 135" stroke="#86efac" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Little flowers on arch */}
          <circle cx="50" cy="85" r="5" fill="#f43f5e" />
          <circle cx="80" cy="62" r="6" fill="#ec4899" />
          <circle cx="110" cy="85" r="5" fill="#f43f5e" />
          {/* Left Dove */}
          <ellipse cx="62" cy="100" rx="16" ry="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="70" cy="94" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <polygon points="76,95 82,97 76,99" fill="#f59e0b" />
          {/* Right Dove */}
          <ellipse cx="98" cy="100" rx="16" ry="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="90" cy="94" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <polygon points="84,95 78,97 84,99" fill="#f59e0b" />
          {/* Heart above */}
          <path d="M80 84C80 84 74 78 74 73C74 70 76.5 68 79 68C80 68 80 69 80 69C80 69 80 68 81 68C83.5 68 86 70 86 73C86 78 80 84 80 84Z" fill="#ef4444" />
        </svg>
      );

    case "AHLI_WARIS":
      // Golden royal crown / Heritage seal scroll (as in the reference image)
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="140" rx="54" ry="10" fill="#0f172a" fillOpacity="0.1" />
          {/* Crown Base */}
          <path d="M36 122C36 122 80 130 124 122L132 76L106 94L80 60L54 94L28 76L36 122Z" fill="url(#crownGrad)" stroke="#b45309" strokeWidth="3" strokeLinejoin="round" />
          {/* Jewels */}
          <circle cx="28" cy="74" r="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
          <circle cx="80" cy="58" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
          <circle cx="132" cy="74" r="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
          {/* Bottom rim */}
          <ellipse cx="80" cy="122" rx="44" ry="8" fill="#78350f" />
          <circle cx="60" cy="122" r="3" fill="#ffffff" />
          <circle cx="80" cy="122" r="3" fill="#ffffff" />
          <circle cx="100" cy="122" r="3" fill="#ffffff" />
          <defs>
            <linearGradient id="crownGrad" x1="30" y1="60" x2="130" y2="130" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="0.6" stopColor="#eab308" />
              <stop offset="1" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "LAINNYA":
    default:
      // Official envelope with wax seal & paper airplane badge
      return (
        <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <ellipse cx="80" cy="140" rx="56" ry="10" fill="#0f172a" fillOpacity="0.1" />
          {/* Blue Circular Backdrop */}
          <circle cx="80" cy="88" r="48" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
          {/* Envelope */}
          <rect x="48" y="66" width="64" height="44" rx="4" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          <path d="M48 68L80 92L112 68" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" />
          {/* Red Wax Seal */}
          <circle cx="80" cy="92" r="8" fill="#ef4444" />
          <circle cx="80" cy="92" r="5" fill="#dc2626" />
          {/* Paper Airplane Badge (like reference image) */}
          <g transform="translate(104, 40)">
            <path d="M0 24L26 0L14 30L9 20L0 24Z" fill="#0284c7" />
            <path d="M9 20L26 0L14 30L9 20Z" fill="#38bdf8" />
          </g>
        </svg>
      );
  }
}
