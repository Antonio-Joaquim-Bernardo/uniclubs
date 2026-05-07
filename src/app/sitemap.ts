import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const routes = [
  "/",
  "/clubes",
  "/eventos",
  "/inscricoes",
  "/membros",
  "/dashboard",
  "/dashboard/dashboard_admin",
  "/dashboard/dashboard_admin_clube",
  "/dashboard/dashboard_membro",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return routes.map((route) => ({
    url: new URL(route, baseUrl).toString(),
    lastModified: new Date(),
  }));
}
