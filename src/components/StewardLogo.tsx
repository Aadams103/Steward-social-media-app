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
  const lightFull = "/steward-logo-light.svg";
  const darkFull = "/steward-logo-dark.svg";
  const src = variant === "mark" ? "/steward-logo-mark.svg" : scheme === "dark" ? darkFull : lightFull;
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
      />
    </div>
  );
}
