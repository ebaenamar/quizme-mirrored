import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Create a matcher for public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/embed/:path*",
  "/api/public/:path*"
]);

// Export the middleware with custom configuration
export default clerkMiddleware((auth, req: NextRequest) => {
  // Check if the request is for a public route
  if (isPublicRoute(req)) {
    // For embed routes, set CSP headers
    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", "frame-ancestors *;");
    return response;
  }
});

// Configure routes in the matcher pattern
export const config = {
  matcher: [
    // Exclude static files and include all other routes
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
