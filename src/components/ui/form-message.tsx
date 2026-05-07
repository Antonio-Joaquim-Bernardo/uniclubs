import type { ActionState } from "@/lib/domain";

export function FormMessage({ state }: { state: Pick<ActionState, "status" | "message"> }) {
  if (!state.message) {
    return null;
  }

  const tone =
    state.status === "error"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";

  return (
    <div className={`surface-card mt-4 border px-4 py-3 text-sm ${tone}`}>
      {state.message}
    </div>
  );
}

