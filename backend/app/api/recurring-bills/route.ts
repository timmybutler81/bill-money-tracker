import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recurringBills = await prisma.recurringBill.findMany();

    return Response.json(recurringBills, { status: 200 });
  } catch (error) {
    console.error("Error fetching recurring bills:", error);
    return Response.json(
      { error: "Failed to fetch recurring bills" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const recurringBill = await prisma.recurringBill.create({
      data: {
        userId: body.userId,
        categoryId: body.categoryId,
        name: body.name,
        amount: body.amount,
        frequency: body.frequency,
        startDate: new Date(body.startDate),
        nextDueDate: new Date(body.nextDueDate),
        active: body.active ?? true
      },
    });

    return Response.json(recurringBill, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring bill:", error);
    return Response.json(
      { error: "Failed to create recurring bill" },
      { status: 500 }
    );
  }
}