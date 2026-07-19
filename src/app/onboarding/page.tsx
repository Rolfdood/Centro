import { redirect } from "next/navigation";

import { OnboardingAccountList } from "@/components/features/accounts/OnboardingAccountList";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function OnboardingPage() {
  const authentication = await getAuthenticatedUser();
  if (!authentication.ok) {
    redirect("/login");
  }

  const connectedAccount = await db.socialAccount.findFirst({
    where: { userId: authentication.userId },
    select: { id: true },
  });

  if (connectedAccount) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-col items-center gap-4 text-center sm:mb-12">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Getting started
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Connect your first account
        </h1>
      </div>
      <OnboardingAccountList />
    </main>
  );
}
