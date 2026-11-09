import type { SVGProps } from "react";

export type AdminIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
};

function BaseSvg({
  size = 20,
  strokeWidth = 2,
  children,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/**
 * Vector SVG Emblem for KALOSARA Admin Brand — 100% vector, sharp at any resolution.
 */
export function KalosaraEmblemSvg({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      shapeRendering="geometricPrecision"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kalosara-bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60bcfb" />
          <stop offset="50%" stopColor="#2d92e6" />
          <stop offset="100%" stopColor="#1879d1" />
        </linearGradient>
        <linearGradient id="kalosara-gloss" x1="22" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="kalosara-shield" x1="10" y1="8" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="kalosara-gold" x1="16" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Outer Glossy Glass Squircle */}
      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="12"
        fill="url(#kalosara-bg)"
      />
      {/* Top Specular Gloss Highlight */}
      <path
        d="M14 3H30C36.075 3 41 7.925 41 14V18C35 20.5 28.5 21.5 22 21.5C15.5 21.5 9 20.5 3 18V14C3 7.925 7.925 3 14 3Z"
        fill="url(#kalosara-gloss)"
      />
      <rect
        x="2.75"
        y="2.75"
        width="38.5"
        height="38.5"
        rx="11.25"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      {/* Inner Heraldic Shield */}
      <path
        d="M22 8.5L32.5 12.8V21.2C32.5 28.1 27.9 33.6 22 35.8C16.1 33.6 11.5 28.1 11.5 21.2V12.8L22 8.5Z"
        fill="url(#kalosara-shield)"
      />
      {/* Inner Soft Sky-Blue Core */}
      <path
        d="M22 11.5L29.8 14.7V21C29.8 26.2 26.4 30.4 22 32.3C17.6 30.4 14.2 26.2 14.2 21V14.7L22 11.5Z"
        fill="#0284c7"
      />
      {/* Kalosara Sacred Ring & Star */}
      <circle
        cx="22"
        cy="21"
        r="5.2"
        stroke="url(#kalosara-gold)"
        strokeWidth="1.8"
      />
      <path
        d="M22 17.2L23.15 19.65L25.8 20L23.85 21.85L24.35 24.5L22 23.2L19.65 24.5L20.15 21.85L18.2 20L20.85 19.65L22 17.2Z"
        fill="url(#kalosara-gold)"
      />
    </svg>
  );
}

export function DashboardSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <rect x="3" y="3" width="7.5" height="9" rx="2" fill="currentColor" fillOpacity="0.16" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="2" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="2" fill="currentColor" fillOpacity="0.16" />
      <rect x="3" y="15.5" width="7.5" height="5.5" rx="2" />
    </BaseSvg>
  );
}

export function HomeSettingsSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.2" fill="currentColor" fillOpacity="0.12" />
      <circle cx="12" cy="14" r="2.5" />
    </BaseSvg>
  );
}

export function BuildingShieldSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M4 21h16" />
      <path d="M6 21V7l6-4 6 4v14" fill="currentColor" fillOpacity="0.12" />
      <path d="M9.5 11h1M13.5 11h1M9.5 14.5h1M13.5 14.5h1" />
      <path d="M10.5 21v-3.5h3V21" />
    </BaseSvg>
  );
}

export function ServiceBadgeSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path
        d="M12 3l7.5 3.2v5.8c0 5-3.2 8.9-7.5 10.5C7.7 20.9 4.5 17 4.5 12V6.2L12 3z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path d="M9 12.2l2 2 4-4.2" />
    </BaseSvg>
  );
}

export function NewsPaperSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H18a2 2 0 0 1 2 2v13.5a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 18.5V5.5Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </BaseSvg>
  );
}

export function MegaphoneSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path
        d="M18 4L8 8.5H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3L18 19V4Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path d="M8 14.5l1.2 4.5a1.5 1.5 0 0 0 2.8-.4L11.2 15" />
      <path d="M20.5 9.2a3.5 3.5 0 0 1 0 4.6" />
    </BaseSvg>
  );
}

export function CalendarEventSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="16"
        rx="2.5"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M8 3v3M16 3v3M3.5 9.5h17" />
      <circle cx="8.5" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="15.5" cy="14" r="1" fill="currentColor" />
    </BaseSvg>
  );
}

export function GalleryPhotoSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <circle cx="8.5" cy="9.5" r="1.75" />
      <path d="M21 15.5l-4.6-4.6a1.5 1.5 0 0 0-2.1 0L6 19.5" />
    </BaseSvg>
  );
}

export function DocumentSealSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path
        d="M6 3h8.5L19 7.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M14 3v5h5" />
      <path d="M8 12.5h8M8 16h5" />
    </BaseSvg>
  );
}

export function ChartBarSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M3 20.5h18" />
      <rect x="5" y="11" width="3.5" height="9.5" rx="1" fill="currentColor" fillOpacity="0.2" />
      <rect x="10.25" y="6" width="3.5" height="14.5" rx="1" fill="currentColor" fillOpacity="0.2" />
      <rect x="15.5" y="3.5" width="3.5" height="17" rx="1" fill="currentColor" fillOpacity="0.2" />
    </BaseSvg>
  );
}

export function SparkleGemSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path
        d="M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </BaseSvg>
  );
}

export function MapPinBuildingSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path
        d="M12 21s7-5.8 7-11.2A7 7 0 0 0 5 9.8C5 15.2 12 21 12 21Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <circle cx="12" cy="9.8" r="2.6" />
    </BaseSvg>
  );
}

export function UsersShieldSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="9" cy="7.5" r="3.5" fill="currentColor" fillOpacity="0.14" />
      <path d="M3 19.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5" />
      <path d="M16 11.5l2 2 3.5-3.5" />
    </BaseSvg>
  );
}

export function UserVerifiedSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="10" cy="8" r="3.5" fill="currentColor" fillOpacity="0.14" />
      <path d="M3.5 19.5c0-3.2 2.9-5.5 6.5-5.5 1.3 0 2.5.3 3.5.9" />
      <path d="M16 18.5l2 2 3.5-4" />
    </BaseSvg>
  );
}

export function InfographicPieSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <path
        d="M21 12A9 9 0 1 1 12 3v9h9Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" />
    </BaseSvg>
  );
}

export function InboxMailSvg(props: AdminIconProps) {
  return (
    <BaseSvg {...props}>
      <rect
        x="3"
        y="4.5"
        width="18"
        height="15"
        rx="2.5"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M3.5 6l8.5 6.5L20.5 6" />
    </BaseSvg>
  );
}
