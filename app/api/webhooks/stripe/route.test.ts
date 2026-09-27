import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Mock } from "vitest";
import { POST } from "./route";
import { stripe } from "@/lib/stripe";

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));
describe("POST /api/webhooks/stripe", () => {
  let testUserId: string;
  let testWorkspaceId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: "test-stripe-webhook@example.com",
        name: "Stripe Test User",
      },
    });
    testUserId = user.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: "Stripe Test Workspace",
        ownerId: testUserId,
      },
    });
    testWorkspaceId = workspace.id;

    await prisma.workspaceMember.create({
      data: {
        userId: testUserId,
        workspaceId: testWorkspaceId,
        // role: "OWNER",
      },
    });
  });

  afterAll(async () => {
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: testWorkspaceId },
    });
    await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it("returns 400 if Missing Stripe signature", async () => {
    const request = new NextRequest(`http://localhost/api/webhooks/stripe`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 if signature is invalid", async () => {
    // this will tell jab ye function call ho, normal return karne ki jagah, ek Error throw kar do

    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const request = new NextRequest(`http://localhost/api/webhooks/stripe`, {
      method: "POST",
      headers: { "stripe-signature": "fake-signature" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 200 if workspace upgrade", async () => {
    const fakeEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_test123",
          subscription: "sub_test123",
          metadata: {
            workspaceId: testWorkspaceId,
          },
        },
      },
    };
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(fakeEvent as any);

    const request = new NextRequest(`http://localhost/api/webhooks/stripe`, {
      method: "POST",
      headers: { "stripe-signature": "fake-signature" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);

    const upgrade_workspace = await prisma.workspace.findUnique({
      where: { id: testWorkspaceId },
    });
    expect(upgrade_workspace?.plan).toBe("PRO");
  });
  it("returns 200 if workspace downgrade", async () => {
    await prisma.workspace.update({
      where: { id: testWorkspaceId },
      data: { stripeSubscriptionId: "sub_test123" },
    });

    const fakeEvent = {
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_test123",
        },
      },
    };
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(fakeEvent as any);

    const request = new NextRequest(`http://localhost/api/webhooks/stripe`, {
      method: "POST",
      headers: { "stripe-signature": "fake-signature" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);

    const downgraded_workspace = await prisma.workspace.findUnique({
      where: { id: testWorkspaceId },
    });
    expect(downgraded_workspace?.plan).toBe("FREE");
  });
  it("returns 200 if event type is unhandled", async () => {
    const fakeEvent = {
      type: "some.random.event",
      data: {
        object: {},
      },
    };
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(fakeEvent as any);

    const request = new NextRequest(`http://localhost/api/webhooks/stripe`, {
      method: "POST",
      headers: { "stripe-signature": "fake-signature" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
