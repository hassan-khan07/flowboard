import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // raw body nikalo (JSON parse kiye bina)
  const rawBody = await req.text();

  // Stripe ka bheja hua signature header nikalo
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { message: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  // it will verify signature and will make event object
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { message: "Invalid signature." },
      { status: 400 },
    );
  }

 
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;

      if (workspaceId) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            plan: "PRO",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.workspace.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { plan: "FREE" },
      });
      break;
    }

    case "invoice.payment_failed": {
      console.log("Payment failed for subscription:", event.data.object);
      break;
    }

    default:
      console.log("Unhandled event type:", event.type);
  }

  // Step 5: Stripe ko batao "mil gaya, sab theek hai"
  return NextResponse.json({ received: true });
}
