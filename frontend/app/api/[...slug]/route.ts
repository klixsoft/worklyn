import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { BASE_API_URL } from "@/lib/api/base";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");
  const backendUrl = `${BASE_API_URL}/api/v1/${path}`;

  const res = new Response();
  const session = await getIronSession<SessionData>(request, res, sessionOptions);

  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (session?.user?.accessToken) {
    headers.set("Authorization", `Bearer ${session.user.accessToken}`);
  }

  const method = request.method;
  let body: string | undefined = undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  try {
    const backendRes = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding" && key.toLowerCase() !== "content-encoding") {
        resHeaders.set(key, value);
      }
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Proxy request failed";
    return NextResponse.json(
      { message: errMsg },
      { status: 500 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
