import { cn } from "@/lib/utils";

/** Steward logo: mark (S icon) or lockup (mark + STEWARD wordmark). */
interface StewardLogoProps {
  /** "mark" = icon only; "lockup" = mark + wordmark */
  variant?: "mark" | "lockup";
  /** Height in pixels. Lockup width ~5.2× height. */
  size?: number;
  className?: string;
}

export function StewardLogo({
  variant = "mark",
  size = 44,
  className,
}: StewardLogoProps) {
  const src = variant === "mark" ? "/brand/steward-mark.svg" : "/brand/steward-lockup.svg";
  const lockupWidth = variant === "lockup" ? Math.round(size * 5.2) : undefined;

  return (
    <img
      src={src}
      alt=""
      role="presentation"
      className={cn("object-contain object-left shrink-0", className)}
      style={{
        height: `${size}px`,
        width: lockupWidth ? `${lockupWidth}px` : `${size}px`,
      }}
    />
  );
}
