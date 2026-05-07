"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  busyLabel = "A guardar...",
}: {
  children: string;
  busyLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button-primary w-full sm:w-auto" disabled={pending}>
      {pending ? busyLabel : children}
    </button>
  );
}

