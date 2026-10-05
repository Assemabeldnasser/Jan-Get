import { auth } from "@/lib/auth";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const adminEmails = getAdminEmails();

  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    return null;
  }

  return session;
}