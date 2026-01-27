import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCurrentBrand } from "@/hooks/use-api";

/**
 * AppLogo Component
 * 
 * Renders brand logo with fallback to Steward logo.
 * Supports both lockup (logo + wordmark) and mark (icon only) variants.
 * Automatically selects light/dark assets based on theme.
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
  /** Optional brand logo URL (overrides active brand from store) */
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
  const { data: currentBrand } = useCurrentBrand();
  const [imageError, setImageError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  // Determine which brand logo URL to use
  const brandLogoUrl = useMemo(() => {
    if (propBrandLogoUrl) return propBrandLogoUrl;
    // Check if currentBrand has logoUrl
    const brand = currentBrand;
    if (brand?.logoUrl) {
      return brand.logoUrl;
    }
    // Fallback to avatarUrl if logoUrl doesn't exist
    if (brand?.avatarUrl) {
      return brand.avatarUrl;
    }
    return null;
  }, [propBrandLogoUrl, currentBrand]);

  // Add cache-busting if brand has logoUpdatedAt or updatedAt
  const brandLogoUrlWithCache = useMemo(() => {
    if (!brandLogoUrl) return null;
    const brand = currentBrand;
    // Prefer logoUpdatedAt if available, otherwise use updatedAt
    const timestampField = (brand as any)?.logoUpdatedAt || brand?.updatedAt;
    if (timestampField) {
      const timestamp = timestampField instanceof Date 
        ? timestampField.getTime() 
        : new Date(timestampField).getTime();
      const separator = brandLogoUrl.includes('?') ? '&' : '?';
      return `${brandLogoUrl}${separator}v=${timestamp}`;
    }
    return brandLogoUrl;
  }, [brandLogoUrl, currentBrand]);

  // Steward fallback assets (SVG-based lockups + marks)
  const stewardAssets = {
    lockup: {
      light: "/brand/steward/steward-lockup-horizontal-white.svg",
      dark: "/brand/steward/steward-lockup-horizontal-black.svg",
    },
    mark: {
      light: "/brand/steward/steward-mark-white.svg",
      dark: "/brand/steward/steward-mark-black.svg",
    },
  };

  // Fallback to legacy SVG paths if PNGs don't exist
  const stewardAssetsLegacy = {
    lockup: {
      light: "/steward-logo-light.svg",
      dark: "/steward-logo-dark.svg",
    },
    mark: {
      light: "/steward-logo-mark.svg",
      dark: "/steward-logo-mark-dark.svg",
    },
  };

  // Determine which asset to use
  const stewardAsset = stewardAssets[variant][theme];
  const stewardAssetLegacy = stewardAssetsLegacy[variant][theme];

  // Use brand logo if available and no error, otherwise use Steward
  // Try new PNG assets first, fall back to legacy SVG if they don't exist
  const stewardFallback = fallbackAttempted ? stewardAssetLegacy : stewardAsset;
  const logoSrc = brandLogoUrlWithCache && !imageError 
    ? brandLogoUrlWithCache 
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
          
          // If brand logo fails, fall back to Steward
          if (brandLogoUrlWithCache && !imageError) {
            setImageError(true);
            img.src = stewardFallback;
            return;
          }
          
          // If new Steward asset fails, try legacy SVG
          if (logoSrc === stewardAsset && !fallbackAttempted) {
            setFallbackAttempted(true);
            img.src = stewardAssetLegacy;
            return;
          }
          
          // If legacy also fails, keep showing it (broken image is better than nothing)
          console.warn(`Failed to load logo: ${logoSrc}`);
        }}
      />
    </div>
  );
}
