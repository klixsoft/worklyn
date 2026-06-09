import ky from "ky";
import { getSession } from "@/lib/session";
import { BASE_API_URL } from "./base";

export const serverApi = ky.create({
  prefix: `${BASE_API_URL}/api/v1`,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const session = await getSession();
        if (session?.user?.accessToken) {
          request.headers.set("Authorization", `Bearer ${session.user.accessToken}`);
        }
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        if (response.status === 401 && retryCount === 0) {
          const session = await getSession();
          if (session?.user?.refreshToken) {
            try {
              const refreshRes = await ky.post(`${BASE_API_URL}/api/v1/auth/refresh`, {
                json: { refresh_token: session.user.refreshToken },
              });

              if (refreshRes.ok) {
                const newTokens = await refreshRes.json<{ access_token: string; refresh_token: string }>();
                session.user.accessToken = newTokens.access_token;
                session.user.refreshToken = newTokens.refresh_token;
                await session.save();

                const headers = new Headers(request.headers);
                headers.set("Authorization", `Bearer ${newTokens.access_token}`);

                return ky.retry({
                  request: new Request(request, { headers }),
                  code: "TOKEN_REFRESHED",
                });
              }
            } catch (err) {
              console.error("Token refresh failed:", err);
            }
          }
        }
      },
    ],
  },
});


export async function hasPermissionServer(permission: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) {
    return false;
  }
  if (session.user.role === "admin" || session.user.permissions.includes("*")) {
    return true;
  }
  if (session.user.permissions.includes(permission)) {
    return true;
  }
  const parts = permission.split(":");
  if (parts.length > 1) {
    const resource = parts[0];
    if (session.user.permissions.includes(`${resource}:*`)) {
      return true;
    }
  }
  return false;
}
