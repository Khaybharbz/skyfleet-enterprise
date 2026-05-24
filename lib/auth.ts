import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev_secret"
);

export type Role = "admin" | "user" | "driver";

export type SessionUser = {
  email: string;
  role: Role;
};

/**
 * CREATE TOKEN (SERVER SAFE)
 */
export async function createToken(
  user: SessionUser
) {
  return await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * VERIFY TOKEN (SERVER SAFE)
 */
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      secret
    );

    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}