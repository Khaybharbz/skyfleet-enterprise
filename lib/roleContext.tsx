"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { jwtDecode } from "jwt-decode";

type Role = "admin" | "user" | "driver";

type RoleUser = {
  email: string;
  role: Role;
};

const RoleContext = createContext<{
  user: RoleUser | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export function RoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<RoleUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    try {
      /**
       * GET TOKEN FROM COOKIE
       */
      const cookie = document.cookie
        .split("; ")
        .find((c) =>
          c.startsWith("skyfleet_token=")
        );

      if (!cookie) {
        setLoading(false);
        return;
      }

      const token =
        cookie.split("=")[1];

      /**
       * DECODE JWT
       */
      const decoded =
        jwtDecode<RoleUser>(token);

      setUser(decoded);
    } catch (err) {
      console.error(
        "Role decode failed",
        err
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <RoleContext.Provider
      value={{
        user,
        loading,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}