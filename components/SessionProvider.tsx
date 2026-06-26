"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/** NextAuth SessionProvider 客户端包装 */
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
