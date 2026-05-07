export default function Loading() {
  return (
    <div className="section-shell section-spacing">
      <div className="surface-card-strong p-8">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="mt-5 h-12 w-2/3 animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-4 h-5 w-full animate-pulse rounded-full bg-white/10" />
        <div className="mt-3 h-5 w-5/6 animate-pulse rounded-full bg-white/10" />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-[28px] bg-white/10" />
            <div className="h-64 animate-pulse rounded-[28px] bg-white/10" />
          </div>
          <div className="h-[34rem] animate-pulse rounded-[28px] bg-white/10" />
        </div>
      </div>
    </div>
  );
}

