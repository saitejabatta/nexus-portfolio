import { cn } from "@/lib/utils";

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Add the scanline shimmer overlay. */
  scanline?: boolean;
  /** Add a cyan glow halo. */
  glow?: boolean;
};

/** Frosted glass surface — the core building block of the NEXUS UI. */
export function GlassPanel({
  className,
  scanline,
  glow,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl",
        scanline && "scanline",
        glow && "glow-cyan",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
