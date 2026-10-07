import { NextRequest, NextResponse } from "next/server";
import { verifyOwnerCredentials, setOwnerSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!verifyOwnerCredentials(password)) {
      return NextResponse.json(
        { success: false, error: "Invalid owner PIN or password" },
        { status: 401 }
      );
    }

    await setOwnerSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Owner authenticated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
