"use client";

import React from "react";
import type { SVGProps } from "react";
import {
  LayoutDashboard,
  Newspaper,
  Megaphone,
  Calendar,
  Image as ImageIcon,
  FileText,
  BarChart3,
  Sparkles,
  MapPin,
  Users,
  ShieldCheck,
  PieChart,
  Inbox,
  Home,
  Building2,
  Award,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  LogOut,
  Menu,
  Bell,
  FolderOpen,
  Tag,
  Lock,
  KeyRound,
  HardDrive,
  History,
  Phone,
  Mail,
  Clock,
  Globe,
  Layers,
  Sliders,
} from "lucide-react";

export type AdminIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
};

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
        <linearGradient
          id="kalosara-bg"
          x1="0"
          y1="0"
          x2="44"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#60bcfb" />
          <stop offset="50%" stopColor="#2d92e6" />
          <stop offset="100%" stopColor="#1879d1" />
        </linearGradient>
        <linearGradient
          id="kalosara-gloss"
          x1="22"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient
          id="kalosara-shield"
          x1="10"
          y1="8"
          x2="34"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient
          id="kalosara-gold"
          x1="16"
          y1="12"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="12"
        fill="url(#kalosara-bg)"
      />
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
      <path
        d="M22 8.5L32.5 12.8V21.2C32.5 28.1 27.9 33.6 22 35.8C16.1 33.6 11.5 28.1 11.5 21.2V12.8L22 8.5Z"
        fill="url(#kalosara-shield)"
      />
      <path
        d="M22 11.5L29.8 14.7V21C29.8 26.2 26.4 30.4 22 32.3C17.6 30.4 14.2 26.2 14.2 21V14.7L22 11.5Z"
        fill="#0284c7"
      />
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

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number | string; className?: string }>
> = {
  dashboard: LayoutDashboard,
  home: Home,
  profil: Building2,
  building: Building2,
  pelayanan: Award,
  award: Award,
  berita: Newspaper,
  news: Newspaper,
  pengumuman: Megaphone,
  megaphone: Megaphone,
  agenda: Calendar,
  calendar: Calendar,
  galeri: ImageIcon,
  image: ImageIcon,
  photo: ImageIcon,
  dokumen: FileText,
  document: FileText,
  file: FileText,
  statistik: BarChart3,
  chart: BarChart3,
  potensi: Sparkles,
  sparkles: Sparkles,
  fasilitas: MapPin,
  mappin: MapPin,
  infografis: PieChart,
  piechart: PieChart,
  inbox: Inbox,
  mail: Mail,
  pengguna: Users,
  users: Users,
  verifikasi: ShieldCheck,
  shield: ShieldCheck,
  search: Search,
  plus: Plus,
  add: Plus,
  refresh: RefreshCw,
  edit: Edit3,
  trash: Trash2,
  delete: Trash2,
  eye: Eye,
  view: Eye,
  close: X,
  check: Check,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  upload: UploadCloud,
  external: ExternalLink,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  logout: LogOut,
  menu: Menu,
  bell: Bell,
  folder: FolderOpen,
  tag: Tag,
  lock: Lock,
  key: KeyRound,
  storage: HardDrive,
  history: History,
  phone: Phone,
  clock: Clock,
  globe: Globe,
  layers: Layers,
  sliders: Sliders,
};

export const EMOJI_ICON: Record<string, string> = {
  "📊": "dashboard",
  "🏠": "home",
  "🏛️": "building",
  "🛡️": "pelayanan",
  "📰": "berita",
  "📢": "pengumuman",
  "📅": "agenda",
  "🖼️": "galeri",
  "📄": "dokumen",
  "📈": "statistik",
  "✨": "potensi",
  "📍": "fasilitas",
  "🥧": "infografis",
  "📥": "inbox",
  "👥": "pengguna",
  "✅": "verifikasi",
  "🔍": "search",
  "➕": "plus",
  "🔄": "refresh",
  "✏️": "edit",
  "🗑️": "trash",
  "👁️": "eye",
  "📁": "folder",
  "🏷️": "tag",
};

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const mappedKey = EMOJI_ICON[name] ?? name;
  const Comp =
    ICON_MAP[mappedKey] ?? ICON_MAP[mappedKey.toLowerCase()] ?? Layers;
  return <Comp size={size} className={`shrink-0 ${className}`} />;
}
