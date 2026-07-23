import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isVerified = req.auth?.user?.isVerified;

  if (isLoggedIn && !isVerified) {
    return NextResponse.redirect(
      new URL("/verify-email-pending", req.nextUrl.origin),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings", "/workspace/:path*"],
};
