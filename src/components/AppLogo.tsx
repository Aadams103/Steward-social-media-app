import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * AppLogo Component
 * 
 * Renders brand logo with fallback to Steward logo.
 * Supports both lockup (logo + wordmark) and mark (icon only) variants.
 * Automatically selects light/dark assets based on theme. A brand logo can be
 * supplied explicitly by authenticated surfaces without making API requests
 * from public marketing or authentication pages.
 * 
 * @param variant - "lockup" (full logo) or "mark" (icon only)
 * @param theme - "light" (for dark UI) or "dark" (for light UI)
 * @param size - Height in pixels (width scales automatically)
 * @param brandLogoUrl - Optional brand logo URL (overrides active brand)
 * @param className - Additional CSS classes
 */
interface AppLogoProps {
  /** "lockup" = mark + wordmark; "mark" = icon only (e.g. collapsed sidebar) */
  variant?: "lockup" | "mark";
  /** "light" = for dark backgrounds (nav/sidebar); "dark" = for light backgrounds (hero, auth) */
  theme?: "light" | "dark";
  /** Height in pixels. Width scales to preserve aspect ratio. */
  size?: number;
  /** Optional brand logo URL supplied by an authenticated parent surface */
  brandLogoUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

export function AppLogo({
  variant = "lockup",
  theme = "light",
  size = 32,
  brandLogoUrl: propBrandLogoUrl,
  className,
}: AppLogoProps) {
  const [imageError, setImageError] = useState(false);

  const stewardFallback =
    variant === "mark"
      ? theme === "light"
        ? "/brand/steward/steward-mark-silver.svg"
        : "/brand/steward/steward-mark-navy.svg"
      : theme === "light"
        ? "/brand/steward/steward-lockup-silver.svg"
        : "/brand/steward/steward-lockup-navy.svg";
  const logoSrc = propBrandLogoUrl && !imageError
    ? propBrandLogoUrl
    : stewardFallback;

  const padding = Math.ceil(size * 0.5);

  return (
    <div
      className={cn("flex items-center shrink-0", className)}
      style={{ padding: `${padding}px 0` }}
      aria-hidden
    >
      <img
        src={logoSrc}
        alt=""
        role="presentation"
        className="object-contain object-left"
        style={{
          height: `${size}px`,
          maxWidth: variant === "mark" ? `${size}px` : "none",
        }}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          if (propBrandLogoUrl && !imageError) {
            setImageError(true);
            img.src = stewardFallback;
          } else {
            console.warn(`Failed to load logo: ${logoSrc}`);
          }
        }}
      />
    </div>
  );
}
