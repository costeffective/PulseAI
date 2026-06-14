import { AuthPage } from "@/components/auth/auth-page";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <AuthPage mode="login" authError={params.error} />;
}
