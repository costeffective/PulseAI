"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthMethod = "password" | "magic-link";
type SuccessView = "magic-link" | "confirm-email";

interface AuthFormProps {
  mode: "login" | "signup";
  authError?: string;
}

export function AuthForm({ mode, authError }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [successView, setSuccessView] = useState<SuccessView | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    authError === "auth"
      ? "That sign-in link expired or is invalid. Try signing in again."
      : null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const isSignup = mode === "signup";
  const usesPassword = authMethod === "password";

  const resetFormState = () => {
    setSubmittedEmail(null);
    setSuccessView(null);
    setError(null);
    setPassword("");
  };

  const switchAuthMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    setError(null);
    setPassword("");
  };

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
    setSuccessView("magic-link");
  };

  const signInWithPassword = async () => {
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      if (signInError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Incorrect email or password.");
        return;
      }

      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const signUpWithPassword = async () => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSubmittedEmail(email.trim());
    setSuccessView("confirm-email");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (usesPassword) {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }

        if (isSignup) {
          await signUpWithPassword();
        } else {
          await signInWithPassword();
        }
      } else {
        await sendMagicLink(email.trim());
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedEmail && successView) {
    const isMagicLink = successView === "magic-link";

    return (
      <div className="mx-auto w-full min-w-0 max-w-md">
        <div className="rounded-3xl border border-border/50 bg-card/80 p-8 shadow-sm backdrop-blur-sm ring-1 ring-foreground/5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60">
            <CheckCircle2 className="size-7" />
          </div>

          <h2 className="mt-6 text-center font-sans text-2xl font-semibold tracking-tight text-foreground">
            Check your inbox
          </h2>
          <p className="mt-3 text-center font-sans text-sm leading-6 text-muted-foreground">
            {isMagicLink ? (
              <>
                We sent a secure magic link to{" "}
                <span className="font-medium text-foreground">{submittedEmail}</span>
                . Click it to {isSignup ? "finish creating your account" : "sign in"}.
              </>
            ) : (
              <>
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{submittedEmail}</span>
                . Confirm your email, then sign in with your password.
              </>
            )}
          </p>

          <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <p className="font-sans text-xs leading-5 text-muted-foreground">
              {isMagicLink
                ? "Link expires in about an hour. Check spam or promotions if you don't see it within a minute."
                : "After confirming, return here and sign in with the email and password you just created."}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {isMagicLink && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
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
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-full text-muted-foreground"
              onClick={resetFormState}
            >
              <ArrowLeft className="size-4" />
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-md">
      <div className="mb-8 lg:hidden">
        <h1 className="font-heading text-3xl tracking-tight text-foreground">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-2 font-sans text-sm leading-6 text-muted-foreground">
          {isSignup
            ? "Start triaging feedback with AI in minutes."
            : usesPassword
              ? "Sign in with your email and password."
              : "We'll email you a secure sign-in link."}
        </p>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/80 p-6 shadow-sm backdrop-blur-sm ring-1 ring-foreground/5 sm:p-8">
        <div className="mb-6 grid h-10 w-full grid-cols-2 rounded-full bg-muted p-1">
          <Link
            href="/login"
            className={cn(
              "inline-flex items-center justify-center rounded-full px-3 text-sm font-medium transition-all",
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
              "inline-flex items-center justify-center rounded-full px-3 text-sm font-medium transition-all",
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
            {usesPassword
              ? isSignup
                ? "Choose a password for your workspace."
                : "Enter your email and password to continue."
              : "Prefer no password? We'll send a one-time sign-in link."}
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
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          {usesPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignup ? "At least 6 characters" : "Your password"}
                  className="h-11 rounded-xl pl-9"
                />
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-full font-sans"
            disabled={
              isLoading ||
              !email.trim() ||
              (usesPassword && password.length < 6)
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {usesPassword
                  ? isSignup
                    ? "Creating account…"
                    : "Signing in…"
                  : "Sending link…"}
              </>
            ) : (
              <>
                {usesPassword
                  ? isSignup
                    ? "Create account"
                    : "Sign in"
                  : isSignup
                    ? "Send magic link"
                    : "Send magic link"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() =>
              switchAuthMethod(usesPassword ? "magic-link" : "password")
            }
            className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <KeyRound className="size-3.5" />
            {usesPassword
              ? isSignup
                ? "Create account without a password"
                : "Sign in without a password"
              : isSignup
                ? "Create account with a password"
                : "Sign in with a password"}
          </button>
        </div>

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

      <p className="mt-6 text-center font-sans text-xs leading-5 text-muted-foreground">
        {usesPassword
          ? "Your password is stored securely by Supabase Auth."
          : "We'll send a one-time sign-in link to your inbox. No password needed."}
      </p>
    </div>
  );
}
