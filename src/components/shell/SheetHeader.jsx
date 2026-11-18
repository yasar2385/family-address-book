export function SheetHeader({ eyebrow, meta, title, description, actions, children }) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border pb-2">
        <p className="mono-caption">{eyebrow}</p>
        {meta ? (
          <>
            <span aria-hidden="true" className="h-3 w-px bg-border" />
            <p className="mono-caption">{meta}</p>
          </>
        ) : null}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
      <h1 className="mt-4 text-3xl md:text-[2.6rem] md:leading-[1.05]">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
