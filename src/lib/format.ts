export function normalizeSearch(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-AO").format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-AO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function percentage(value: number, max: number | null | undefined) {
  if (!max || max <= 0) {
    return null;
  }

  return clampPercent(Math.round((value / max) * 100));
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

