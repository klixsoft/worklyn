import ky from "ky";

export const clientApi = ky.create({
  prefix: "/api",
  hooks: {
    beforeRequest: [
      async () => {
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (!response.ok) {
          try {
            const errorJSON = await response.clone().json() as { errors?: Record<string, string>; detail?: string };
            const responseWithCache = response as Response & { errorData?: { errors?: Record<string, string>; detail?: string } };
            responseWithCache.errorData = errorJSON;
          } catch {
          }
        }
        return response;
      },
    ],
  },
});


export function hasPermissionClient(
  user: { role: string; permissions: string[] } | null | undefined,
  permission: string
): boolean {
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
