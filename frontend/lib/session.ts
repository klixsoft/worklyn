import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    isSuperuser: boolean;
    isStaff: boolean;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phoneNumber?: string;
    documentUrl?: string;
    accessToken: string;
    refreshToken: string;
  };
}

export const sessionOptions = {
  password: process.env.SESSION_COOKIE_PASSWORD || "complex_password_at_least_32_characters_long",
  cookieName: "worklyn_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};


export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
