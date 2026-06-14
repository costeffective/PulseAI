"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  mode: "login" | "signup";
  authError?: string;
}

export function AuthForm({ mode, authError }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    authError === "auth"
      ? "That sign-in link expired or is invalid. Request a new one below."
      : null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const isSignup = mode === "signup";

  const sendMagicLink = async (targetEmail: string) => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: isSignup,
      },
    });

    setIsLoading(false);

    if (signInError) {
      if (
        !isSignup &&
        signInError.message.toLowerCase().includes("signups not allowed")
      ) {
        setError("No account found for that email. Create one instead.");
        return;
      }

      setError(signInError.message);
      return;
    }

    setSubmittedEmail(targetEmail);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendMagicLink(email.trim());
  };

  if (submittedEmail) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-sm ring-1 ring-foreground/5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60">
            <CheckCircle2 className="size-7" />
          </div>

          <h2 className="mt-6 text-center font-sans text-2xl font-semibold tracking-tight text-foreground">
            Check your inbox
          </h2>
          <p className="mt-3 text-center font-sans text-sm leading-6 text-muted-foreground">
            We sent a secure magic link to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>
            . Click it to {isSignup ? "finish creating your account" : "sign in"}.
          </p>

          <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="font-sans text-xs leading-5 text-muted-foreground">
              Link expires in about an hour. Check spam or promotions if you
              don&apos;t see it within a minute.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={() => void sendMagicLink(submittedEmail)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Resending…
                </>
              ) : (
                "Resend magic link"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setSubmittedEmail(null);
                setError(null);
              }}
            >
              <ArrowLeft className="size-4" />
              Use a different email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <h1 className="font-heading text-3xl tracking-tight text-foreground">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-2 font-sans text-sm leading-6 text-muted-foreground">
          {isSignup
            ? "Start triaging feedback with AI in minutes."
            : "Continue to your dashboard with a magic link."}
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-8">
        <div className="mb-6 grid h-10 w-full grid-cols-2 rounded-lg bg-muted p-[3px]">
          <Link
            href="/login"
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3 text-sm font-medium transition-all",
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3 text-sm font-medium transition-all",
              mode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Create account
          </Link>
        </div>

        <div className="mb-6 hidden lg:block">
          <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">
            {isSignup ? "Create your account" : "Sign in to Pulse"}
          </h2>
          <p className="mt-1.5 font-sans text-sm leading-6 text-muted-foreground">
            {isSignup
              ? "Enter your work email — we'll send a link to get you started."
              : "Enter your email and we'll send you a secure sign-in link."}
          </p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-11 pl-9"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-11 w-full font-sans"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending link…
              </>
            ) : (
              <>
                {isSignup ? "Create account" : "Send magic link"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center font-sans text-xs leading-5 text-muted-foreground">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to Pulse?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>

      <p
        className={cn(
          "mt-6 text-center font-sans text-xs leading-5 text-muted-foreground",
        )}
      >
        By continuing, you agree to receive a one-time sign-in email. No password
        required.
      </p>
    </div>
  );
}
