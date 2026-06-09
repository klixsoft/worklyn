import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";


export async function POST(request: NextRequest) {
  /**
   * Authenticates user credentials against the backend API and initiates session.
   */
  try {
    const body = await request.json();
    const { email, password } = body;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://backend:8000";
    const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.detail || "Invalid credentials" },
        { status: res.status }
      );
    }

    const userData = await res.json();
    const session = await getSession();

    session.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      accessToken: userData.access_token,
      refreshToken: userData.refresh_token,
    };
    await session.save();

    return NextResponse.json({ success: true, user: session.user });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
