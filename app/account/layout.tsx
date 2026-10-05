import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user) {
    redirect("/login");
  }

  return children;
}