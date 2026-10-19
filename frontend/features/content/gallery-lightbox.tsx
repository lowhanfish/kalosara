"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ZoomIn,
  Images,
} from "lucide-react";
import { clsx } from "clsx";

export interface GalleryPhoto {
  mediaId: string;
  alt: string;
  sortOrder?: number;
}

interface GalleryPhotoGridProps {
  photos: GalleryPhoto[];
  albumTitle?: string;
}

/**
 * GalleryPhotoGrid renders a responsive photo grid and opens a full-screen,
 * professional lightbox with next/prev navigation when any photo is clicked.
 */
export function GalleryPhotoGrid({ photos, albumTitle }: GalleryPhotoGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleOpen = (index: number) => {
    setActiveIndex(index);
  };

  const handleClose = () => {
    setActiveIndex(null);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <figure
            key={photo.mediaId}
            className="group/img overflow-hidden rounded-xl border border-slate-200/70 bg-white transition-all duration-300 hover:border-slate-300 hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => handleOpen(index)}
              className="relative block aspect-[3/2] w-full overflow-hidden bg-slate-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Perbesar foto ${index + 1}${photo.alt ? `: ${photo.alt}` : ""}`}
            >
              <Image
                src={`/api/v1/public/media/${photo.mediaId}?variant=display`}
                alt={photo.alt || `Foto kegiatan ${index + 1}`}
                fill
                loading="lazy"
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover/img:scale-105"
              />

              {/* Hover overlay with action pill */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/img:opacity-100">
                <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full border border-white/25 bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover/img:translate-y-0">
                  <ZoomIn size={14} className="shrink-0" />
                  Lihat Foto
                </span>
              </div>

              {/* Photo order badge */}
              <span className="absolute top-2.5 left-2.5 rounded-md bg-slate-900/60 px-2 py-0.5 text-[11px] font-medium text-white shadow-xs backdrop-blur-xs">
                Foto {index + 1}
              </span>
            </button>

            {photo.alt && (
              <figcaption className="bg-white p-3 text-xs leading-relaxed text-slate-500">
                {photo.alt}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {activeIndex !== null && (
        <GalleryLightbox
          photos={photos}
          initialIndex={activeIndex}
          albumTitle={albumTitle}
          onClose={handleClose}
        />
      )}
    </>
  );
}

interface GalleryLightboxProps {
  photos: GalleryPhoto[];
  initialIndex: number;
  albumTitle?: string;
  onClose: () => void;
}

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function GalleryLightbox({
  photos,
  initialIndex,
  albumTitle,
  onClose,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<-1 | 1>(1);
  const mounted = useIsMounted();

  // Swipe detection ref
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const total = photos.length;

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex],
  );

  // Keyboard controls & body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, goToNext, goToPrev]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Only swipe if horizontal move is significant and greater than vertical move
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  const currentPhoto = photos[currentIndex];

  if (!mounted) return null;

  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.24,
        ease: "easeOut",
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.18,
        ease: "easeIn",
      },
    }),
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={albumTitle ? `Galeri foto: ${albumTitle}` : "Penampil Galeri"}
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/92 backdrop-blur-md select-none"
    >
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-amber-300 sm:grid">
            <Images size={18} />
          </div>
          <div className="min-w-0">
            {albumTitle && (
              <h2 className="truncate text-sm font-semibold text-white/95 sm:text-base">
                {albumTitle}
              </h2>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 font-medium text-amber-300">
                {currentIndex + 1} / {total}
              </span>
              <span className="hidden sm:inline">
                Gunakan panah keyboard ← → untuk navigasi
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Open full size in new tab */}
          <a
            href={`/api/v1/public/media/${currentPhoto.mediaId}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka gambar ukuran asli di tab baru"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">Ukuran Asli</span>
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup penampil galeri (Escape)"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white/80 transition hover:border-red-400/30 hover:bg-red-500/20 hover:text-red-200"
          >
            <X size={16} />
            <span className="hidden sm:inline font-mono text-[11px] text-white/60">
              ESC
            </span>
          </button>
        </div>
      </header>

      {/* Main viewer viewport */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-3 sm:px-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // If user clicked the dark backdrop directly, close the lightbox
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Navigation Left Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Foto sebelumnya (Panah Kiri)"
            className="group absolute left-3 z-30 flex size-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/70 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-slate-800/90 hover:text-amber-300 sm:left-6 sm:size-14"
          >
            <ChevronLeft
              size={26}
              className="transition-transform group-hover:-translate-x-0.5 sm:size-30"
            />
          </button>
        )}

        {/* Current Image Container with animated transitions */}
        <div className="relative flex size-full max-h-[72vh] max-w-5xl items-center justify-center">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentPhoto.mediaId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative size-full flex items-center justify-center"
            >
              <div className="relative size-full max-h-[70vh]">
                <Image
                  src={`/api/v1/public/media/${currentPhoto.mediaId}?variant=display`}
                  alt={currentPhoto.alt || `Foto kegiatan ${currentIndex + 1}`}
                  fill
                  priority
                  unoptimized
                  className="object-contain drop-shadow-2xl select-none"
                  sizes="(max-width: 1280px) 100vw, 1200px"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Right Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Foto berikutnya (Panah Kanan)"
            className="group absolute right-3 z-30 flex size-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/70 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-slate-800/90 hover:text-amber-300 sm:right-6 sm:size-14"
          >
            <ChevronRight
              size={26}
              className="transition-transform group-hover:translate-x-0.5 sm:size-30"
            />
          </button>
        )}
      </div>

      {/* Bottom Bar: Caption and Thumbnails */}
      <footer className="shrink-0 border-t border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur-md">
        {/* Caption */}
        {currentPhoto.alt && (
          <p className="mx-auto mb-2.5 max-w-2xl text-center text-xs sm:text-sm text-slate-300 line-clamp-2">
            {currentPhoto.alt}
          </p>
        )}

        {/* Thumbnail Strip */}
        {total > 1 && (
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-thin">
            {photos.map((photo, idx) => (
              <button
                key={photo.mediaId}
                type="button"
                onClick={() => goToIndex(idx)}
                aria-label={`Pilih foto ${idx + 1}`}
                aria-current={idx === currentIndex ? "true" : undefined}
                className={clsx(
                  "relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg border transition-all duration-200",
                  idx === currentIndex
                    ? "border-amber-400 opacity-100 ring-2 ring-amber-400/50 scale-105 shadow-md"
                    : "border-white/20 opacity-40 hover:opacity-80",
                )}
              >
                <Image
                  src={`/api/v1/public/media/${photo.mediaId}?variant=thumb`}
                  alt={photo.alt || `Thumbnail ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );

  return createPortal(modalContent, document.body);
}
