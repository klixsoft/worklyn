import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login - Worklyn Portal",
  description: "Secure login for the Worklyn Project Management Portal",
};


export default function LoginPage() {
  /**
   * Server component wrapping client-side LoginForm to enable proper search engine optimization.
   */
  return <LoginForm />;
}
