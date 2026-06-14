import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthSidePanel } from "@/components/auth/auth-side-panel";
import { GlassDockNav } from "@/components/layout/glass-dock-nav";

interface AuthPageProps {
  mode: "login" | "signup";
  authError?: string;
}

export function AuthPage({ mode, authError }: AuthPageProps) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <AuthSidePanel mode={mode} />

      <div className="landing-mesh flex min-h-full flex-1 flex-col">
        <GlassDockNav variant="auth" />

        <main className="flex flex-1 items-center justify-center px-6 pb-10 pt-24 sm:py-16 lg:px-10 lg:pt-28">
          <AuthForm mode={mode} authError={authError} />
        </main>
      </div>
    </div>
  );
}
