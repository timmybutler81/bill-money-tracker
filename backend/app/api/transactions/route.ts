import { prisma } from '@/lib/prisma';
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

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: result.user.id },
      orderBy: { date: 'desc' },
    });

    return Response.json(transactions, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return Response.json(
      { error: 'Failed to fetch transactions' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  const result = await requireAppUser(request);

  if ('error' in result) {
    return result.error;
  }

  try {
    const body = await request.json();

    const category = await prisma.category.findFirst({
      where: {
        id: body.categoryId,
        userId: result.user.id,
      },
      select: {
        id: true
      },
    });

    if (!category) {
      return Response.json(
        {
          error: 'Invalid category'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: result.user.id,
        categoryId: body.categoryId,
        amount: Number(body.amount),
        date: new Date(body.date),
        description: body.description,
        paymentMethod: body.paymentMethod,
        isRecurringInstance: body.isRecurringInstance ?? false,
      },
    });

    return Response.json(transaction, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return Response.json(
      { error: 'Failed to create transaction' },
      { status: 500, headers: corsHeaders }
    );
  }
}