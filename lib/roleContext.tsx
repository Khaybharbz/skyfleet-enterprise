"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type Role = "admin" | "user" | "driver";

type RoleContextType = {
  role: Role;
};

const RoleContext = createContext<RoleContextType>({
  role: "user",
});

export function RoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<Role>("user");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role || "user");
    } catch {
      setRole("user");
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);