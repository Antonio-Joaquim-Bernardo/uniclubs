export default function Loading() {
  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card-strong p-8">
          <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-12 w-3/4 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-4 h-5 w-full animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-5 w-5/6 animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 flex gap-3">
            <div className="h-11 w-36 animate-pulse rounded-full bg-white/10" />
            <div className="h-11 w-28 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="aspect-[4/3] animate-pulse rounded-3xl bg-white/10" />
          <div className="mt-6 grid gap-3">
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

