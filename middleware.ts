// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/api/auth/signin' },
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],           // guard private areas
};