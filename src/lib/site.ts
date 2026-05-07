export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (url) {
    return url.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

