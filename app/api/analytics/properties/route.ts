export async function GET() {
  return Response.json({ 
    success: true,
    endpoint: 'Analytics Properties',
    timestamp: new Date().toISOString()
  });
}