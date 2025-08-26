export async function GET() {
  return Response.json({ 
    success: true,
    endpoint: 'Search Console Sites',
    timestamp: new Date().toISOString()
  });
}