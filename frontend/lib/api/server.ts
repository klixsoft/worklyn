import ky from "ky";
import { getSession } from "@/lib/session";
import { BASE_API_URL } from "./base";

export const serverApi = ky.create({
  prefix: `${BASE_API_URL}/api/v1`,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const session = await getSession();
        if (session?.user) {
          request.headers.set("x-user-id", session.user.id);
          request.headers.set("x-user-role", session.user.role);
          request.headers.set("x-user-permissions", session.user.permissions.join(","));
        }
      },
    ],
    afterResponse: [
      async ({ response }) => {
        if (response.status === 401) {
          /**
           * Refresh token handler for server-side requests can be executed here.
           */
        }
      },
    ],
  },
});


export async function hasPermissionServer(permission: string): Promise<boolean> {
  /**
   * Verifies if the authenticated session user possesses the required permission.
   */
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
