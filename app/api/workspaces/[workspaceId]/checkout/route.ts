import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Please log in to manage billing." },
      { status: 401 },
    );
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
  });

  if (!membership) {
    return NextResponse.json(
      { message: "You're not a member of this workspace." },
      { status: 403 },
    );
  }

  if (membership.role !== "OWNER") {
    return NextResponse.json(
      { message: "Only the workspace owner can manage billing." },
      { status: 403 },
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return NextResponse.json(
      { message: "Workspace not found." },
      { status: 404 },
    );
  }

  if (workspace.plan === "PRO") {
    return NextResponse.json(
      { message: "This workspace is already on the Pro plan." },
      { status: 409 },
    );
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/billing?canceled=true`,
      metadata: {
        workspaceId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      {
        message:
          "Something went wrong creating your checkout session. Please try again.",
      },
      { status: 500 },
    );
  }
}
