import { requireAppUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const result = await requireAppUser(request);

  if ('error' in result) {
    return result.error;
  }

  return Response.json(result.user, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  const result = await requireAppUser(request);

  if ('error' in result) {
    return result.error;
  }

  return Response.json(result.user, { status: 200, headers: corsHeaders });
}