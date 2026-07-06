import { cn } from "@/lib/utils";

type Variant = "solid" | "ghost" | "outline";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium " +
  "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  solid:
    "bg-cyan/15 text-cyan border border-cyan/40 hover:bg-cyan/25 hover:shadow-[var(--glow-cyan)]",
  ghost: "text-text-muted hover:text-text hover:bg-white/5",
  outline:
    "border border-line text-text hover:border-cyan/50 hover:text-cyan hover:scale-[1.02]",
};

type NeonButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function NeonButton({
  variant = "outline",
  className,
  ...props
}: NeonButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
