// components/auth/AuthGuard.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

interface Props { children: React.ReactNode }

export default async function AuthGuard({ children }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }
  return <>{children}</>;
}