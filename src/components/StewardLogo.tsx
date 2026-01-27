import { useState } from "react";
import { cn } from "@/lib/utils";

/** Light mark for dark UI; dark mark for light UI. No shadows, aspect ratio preserved, 0.5× height padding. */
interface StewardLogoProps {
  /** "full" = mark + wordmark; "mark" = icon only (e.g. collapsed sidebar) */
  variant?: "full" | "mark";
  /** "light" = for dark backgrounds (nav/sidebar); "dark" = for light backgrounds (hero, auth) */
  scheme?: "light" | "dark";
  /** Height in pixels. Width scales to preserve aspect ratio. */
  height?: number;
  className?: string;
}

export function StewardLogo({ variant = "full", scheme = "light", height = 32, className }: StewardLogoProps) {
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  
  // Steward SVG assets: dark for light backgrounds, light for dark backgrounds
  const primaryAssets = {
    full: {
      light: "/brand/steward/steward-lockup-horizontal-white.svg",
      dark: "/brand/steward/steward-lockup-horizontal-black.svg",
    },
    mark: {
      light: "/brand/steward/steward-mark-white.svg",
      dark: "/brand/steward/steward-mark-black.svg",
    },
  };
  
  // Fallback to legacy SVG files if new assets don't exist
  const legacyAssets = {
    full: {
      light: "/steward-logo-light.svg",
      dark: "/steward-logo-dark.svg",
    },
    mark: {
      light: "/steward-logo-mark.svg",
      dark: "/steward-logo-mark-dark.svg",
    },
  };
  
  const primarySrc = primaryAssets[variant][scheme];
  const legacySrc = legacyAssets[variant][scheme];
  const src = fallbackAttempted ? legacySrc : primarySrc;
  
  const padding = Math.ceil(height * 0.5);
  return (
    <div
      className={cn("flex items-center shrink-0", className)}
      style={{ padding: `${padding}px 0` }}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        role="presentation"
        className="object-contain object-left"
        style={{
          height: `${height}px`,
          maxWidth: variant === "mark" ? `${height}px` : "none",
        }}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          // If new Steward asset fails, try legacy SVG fallback
          if (src === primarySrc && !fallbackAttempted) {
            setFallbackAttempted(true);
            img.src = legacySrc;
            return;
          }
          console.warn(`Failed to load logo: ${src}`);
        }}
      />
    </div>
  );
}
