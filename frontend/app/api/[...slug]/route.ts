import { NextRequest, NextResponse } from "next/server";
import { serverApi } from "@/lib/api/server";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");

  const method = request.method;
  let body: string | undefined = undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.text();
  }

  const headers: Record<string, string> = {};
  const contentType = request.headers.get("Content-Type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  try {
    const backendRes = await serverApi(path, {
      method,
      headers,
      body,
      throwHttpErrors: false,
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
