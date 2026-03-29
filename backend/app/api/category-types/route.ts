import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const categoryTypes = await prisma.categoryType.findMany({
      orderBy: { name: 'asc' },
    });

    return Response.json(categoryTypes, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error fetching category types:', error);

    return Response.json(
      { error: 'Failed to fetch category types' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const categoryType = await prisma.categoryType.create({
      data: {
        id: body.id,
        name: body.name,
      },
    });

    return Response.json(categoryType, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error creating category type:', error);

    return Response.json(
      {
        error: 'Failed to create category type',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}