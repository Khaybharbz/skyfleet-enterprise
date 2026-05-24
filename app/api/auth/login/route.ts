import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, role } = await req.json();

  const token = await createToken({
    email,
    role,
  });

  const response = NextResponse.json({
    success: true,
  });

  /**
   * HTTP-ONLY COOKIE (SECURE)
   */
  response.cookies.set("skyfleet_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}