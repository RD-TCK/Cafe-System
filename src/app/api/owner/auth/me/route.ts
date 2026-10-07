import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";

export async function GET() {
  const isAuth = await isOwnerAuthenticated();
  return NextResponse.json({
    authenticated: isAuth,
  });
}
