import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";


export async function GET(request: NextRequest) {
  /**
   * Checks authentication status and returns the active user session data.
   */
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session.user });
}
