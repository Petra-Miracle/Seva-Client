import { FadeIn } from "./motion";

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <FadeIn className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            <span className="h-px w-5 bg-accent/60" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight text-text-primary md:text-[34px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary md:text-[15px]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </FadeIn>
  );
}
