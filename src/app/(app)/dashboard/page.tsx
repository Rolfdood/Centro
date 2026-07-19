import { redirect } from "next/navigation";

import { PostHistoryTable } from "@/components/features/posts/PostHistoryTable";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const auth = await getAuthenticatedUser();
  if (!auth.ok) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { timezone: true },
  });
  if (!user) redirect("/login");

  return <PostHistoryTable timezone={user.timezone} />;
}
