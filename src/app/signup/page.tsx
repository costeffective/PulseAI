import { AuthPage } from "@/components/auth/auth-page";

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return <AuthPage mode="signup" authError={params.error} />;
}
