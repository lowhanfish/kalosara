"use client";

import { useState, useCallback } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SkeletonImageProps extends ImageProps {
  wrapperClassName?: string;
  skeletonClassName?: string;
  showIcon?: boolean;
}

export function SkeletonImage({
  className,
  wrapperClassName,
  skeletonClassName,
  showIcon = true,
  fill,
  onLoad,
  alt,
  ...props
}: SkeletonImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill ? "absolute inset-0 h-full w-full" : "inline-block h-full w-full",
        wrapperClassName,
      )}
    >
      {!isLoaded && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-slate-200/85 animate-pulse",
            skeletonClassName,
          )}
        >
          {showIcon && (
            <ImageIcon
              size={24}
              className="text-slate-400/50 animate-pulse"
              aria-hidden="true"
            />
          )}
        </div>
      )}
      <Image
        ref={handleRef}
        fill={fill}
        className={cn(
          "transition-opacity duration-500 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        alt={alt}
        {...props}
      />
    </div>
  );
}
