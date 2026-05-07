import { NextResponse } from "next/server";
import { signOutCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  await signOutCurrentUser();

  return NextResponse.redirect(new URL("/login", request.url));
}
