export async function GET() {
  return Response.json({ 
    success: true,
    endpoint: 'Reports List',
    timestamp: new Date().toISOString()
  });
}