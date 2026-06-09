import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";


export async function POST(request: NextRequest) {
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
        errorData,
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
      isSuperuser: userData.is_superuser,
      firstName: userData.first_name,
      lastName: userData.last_name,
      avatar: userData.avatar,
      phoneNumber: userData.phone_number,
      documentUrl: userData.document_url,
      accessToken: userData.access_token,
      refreshToken: userData.refresh_token,
    };
    await session.save();

    return NextResponse.json({ success: true, user: session.user });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { message: errMsg },
      { status: 500 }
    );
  }
}
