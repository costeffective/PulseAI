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
    <div className="flex min-h-dvh flex-col lg:min-h-full lg:flex-row">
      <AuthSidePanel mode={mode} />

      <div className="landing-mesh flex min-h-dvh min-w-0 flex-1 flex-col lg:min-h-full">
        <GlassDockNav variant="auth" />

        <main className="flex flex-1 items-center justify-center px-4 pb-8 pt-2 sm:px-6 sm:pb-10 lg:px-10 lg:pb-12">
          <AuthForm mode={mode} authError={authError} />
        </main>
      </div>
    </div>
  );
}
