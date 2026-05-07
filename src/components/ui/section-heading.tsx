import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h2 className="panel-title mt-2">{title}</h2>
        {description ? <p className="panel-subtitle mt-3">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}

