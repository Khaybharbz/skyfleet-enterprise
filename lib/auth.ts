export type Role = "admin" | "user" | "driver";

export type TokenPayload = {
  id: string;
  role: Role;
  exp?: number;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function decodeToken(): TokenPayload | null {
  try {
    const token = getToken();
    if (!token) return null;

    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function getRole(): Role {
  const payload = decodeToken();
  return payload?.role || "user";
}

export function isAuthenticated(): boolean {
  return !!getToken();
}