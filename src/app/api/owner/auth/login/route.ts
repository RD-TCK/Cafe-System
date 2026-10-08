import { NextRequest, NextResponse } from "next/server";
import { verifyOwnerCredentials, setOwnerSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, pin, email } = body;
    const credential = password || pin;

    if (!verifyOwnerCredentials(credential, email)) {
      return NextResponse.json(
        { success: false, error: "Invalid owner PIN, email or password" },
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
