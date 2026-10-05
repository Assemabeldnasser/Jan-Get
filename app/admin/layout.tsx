import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const requestHeaders = await headers();

    const request = new Request("http://localhost", {
        headers: requestHeaders,
    });

    const session = await getAdminSession(request);

    if (!session) {
        redirect("/");
    }

    return children;
}