import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";

import { AppSidebar } from "@/components/features/shell/AppSidebar";
import { TopNav } from "@/components/features/shell/TopNav";

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const auth = await getAuthenticatedUser();
  if (!auth.ok) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar user={user} />

      <div className="flex min-h-screen flex-col md:ml-60">
        <TopNav user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
