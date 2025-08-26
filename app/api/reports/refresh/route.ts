export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ 
    success: true,
    refreshed: true,
    timestamp: new Date().toISOString()
  });
}