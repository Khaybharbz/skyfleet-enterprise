"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { Role, decodeToken } from "./auth";

type RoleContextType = {
  role: Role;
  setRole: (role: Role) => void;
};

const RoleContext = createContext<RoleContextType>({
  role: "user",
  setRole: () => {},
});

export function RoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<Role>("user");

  useEffect(() => {
    const tokenData = decodeToken();
    if (tokenData?.role) {
      setRole(tokenData.role);
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);