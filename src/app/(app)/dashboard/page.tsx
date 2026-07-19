import { redirect } from "next/navigation";

import { PostHistoryTable } from "@/components/features/posts/PostHistoryTable";
import { getCurrentAppUser } from "@/lib/app-user";

export default async function DashboardPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");

  return <PostHistoryTable timezone={user.timezone} />;
}
