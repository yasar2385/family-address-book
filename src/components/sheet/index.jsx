import { cn } from "@/lib/utils";

export function MonoLabel({ children, className, as: Tag = "span" }) {
  return <Tag className={cn("mono-caption", className)}>{children}</Tag>;
}

export function Stamp({ children, className, tone = "stamp" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]",
        tone === "stamp" ? "border-stamp/50 text-stamp" : "border-ink/25 text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SheetCard({ children, className, as: Tag = "div" }) {
  return (
    <Tag className={cn("border border-border bg-card", className)}>{children}</Tag>
  );
}

export function Hairline({ className }) {
  return <div aria-hidden="true" className={cn("h-px w-full bg-border", className)} />;
}

export function ContourBackdrop({ className }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className={cn("pointer-events-none absolute inset-0 h-full w-full text-ochre/30", className)}
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      {[40, 70, 100, 132, 168, 206, 246, 288, 332].map((radius, index) => (
        <ellipse
          key={radius}
          cx={200 + (index % 2 ? 8 : -6)}
          cy={210 + (index % 3 ? 4 : -8)}
          rx={radius * 1.15}
          ry={radius}
          stroke="currentColor"
          strokeWidth="0.75"
        />
      ))}
    </svg>
  );
}

export function EmptyState({ title, body, action, icon: Icon }) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-border bg-card px-6 py-10">
      {Icon ? <Icon className="h-5 w-5 text-ink-soft" aria-hidden="true" /> : null}
      <div>
        <p className="font-display text-lg">{title}</p>
        {body ? <p className="mt-1 max-w-md text-sm text-ink-soft">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, detail, className }) {
  return (
    <div className={cn("border border-border bg-card px-4 py-3", className)}>
      <MonoLabel>{label}</MonoLabel>
      <p className="mt-2 font-display text-2xl tabular-nums leading-none">{value}</p>
      {detail ? <p className="mt-1 text-xs text-ink-soft">{detail}</p> : null}
    </div>
  );
}
