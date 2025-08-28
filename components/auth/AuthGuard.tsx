import { auth } from '@/auth';
import { redirect } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export async function AuthGuard({ children, redirectTo = '/api/auth/signin' }: AuthGuardProps) {
  const session = await auth();
  
  if (!session) {
    redirect(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
  }
  
  return <>{children}</>;
}