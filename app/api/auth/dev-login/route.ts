import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/admin', 'http://localhost:3000'));
  
  // Set a simple dev auth cookie
  response.cookies.set('dev_auth', 'true', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 86400,
    path: '/'
  });

  return response;
}