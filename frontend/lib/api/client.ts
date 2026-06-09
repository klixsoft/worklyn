import ky from "ky";

export const clientApi = ky.create({
  prefix: "/api",
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        /**
         * Client-side requests attach session cookies automatically.
         */
      },
    ],
    afterResponse: [
      async ({ response }) => {
        if (response.status === 401) {
          /**
           * Token refresh flow or session validation checks can be handled here.
           */
        }
      },
    ],
  },
});


export function hasPermissionClient(
  user: { role: string; permissions: string[] } | null | undefined,
  permission: string
): boolean {
  /**
   * Checks client-side if the current user possesses permission rights.
   */
  if (!user) {
    return false;
  }
  if (user.role === "admin" || user.permissions.includes("*")) {
    return true;
  }
  if (user.permissions.includes(permission)) {
    return true;
  }
  const parts = permission.split(":");
  if (parts.length > 1) {
    const resource = parts[0];
    if (user.permissions.includes(`${resource}:*`)) {
      return true;
    }
  }
  return false;
}
