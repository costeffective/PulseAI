import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthSidePanel } from "@/components/auth/auth-side-panel";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthPageProps {
  mode: "login" | "signup";
  authError?: string;
}

export function AuthPage({ mode, authError }: AuthPageProps) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <AuthSidePanel mode={mode} />

      <div className="app-shell-bg flex min-h-full flex-1 flex-col">
        <header className="border-b border-border/60 bg-background/80 backdrop-blur-md lg:border-b-0 lg:bg-transparent">
          <div className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-4 lg:max-w-none lg:px-10">
            <div className="flex items-center gap-3">
              <Link href="/" className="lg:hidden">
                <Logo />
              </Link>
              <Link
                href="/"
                className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                <ArrowLeft className="size-4" />
                Back to home
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:py-16 lg:px-10">
          <AuthForm mode={mode} authError={authError} />
        </main>
      </div>
    </div>
  );
}
