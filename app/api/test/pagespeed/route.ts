export async function GET() {
  const configured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  return Response.json({ 
    configured: !!configured,
    apiKey: !!process.env.PAGESPEED_API_KEY
  });
}