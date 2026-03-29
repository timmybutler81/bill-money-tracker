import { prisma } from '@/lib/prisma';
import { requireAppUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCors(response: Response) {
  const headers = new Headers(response.headers);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  const result = await requireAppUser(request);

  if ('error' in result) {
    return withCors(result.error);
  }

  try {
    const categories = await prisma.category.findMany({
      where: { userId: result.user.id },
      orderBy: { name: 'asc' },
    });

    return Response.json(categories, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);

    return Response.json(
      { error: 'Failed to fetch categories' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  const result = await requireAppUser(request);

  if ('error' in result) {
    return withCors(result.error);
  }

  try {
    const body = await request.json();

    const category = await prisma.category.create({
      data: {
        userId: result.user.id,
        name: body.name,
        alias: body.alias,
        typeId: body.typeId,
      },
    });

    return Response.json(category, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error creating category:', error);

    return Response.json(
      { error: 'Failed to create category' },
      { status: 500, headers: corsHeaders }
    );
  }
}