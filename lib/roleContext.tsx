"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

type Role = "admin" | "user" | "driver";

interface RoleContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  setRole: () => {}
});

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setRole(decoded.role || null);
      } catch {
        setRole(null);
      }
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);