export { auth as proxy } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/settings" ,"/workspace/:path*"],
}