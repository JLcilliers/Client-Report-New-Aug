export async function GET() {
  return Response.json({ 
    success: true,
    endpoint: 'Accounts List',
    timestamp: new Date().toISOString()
  });
}