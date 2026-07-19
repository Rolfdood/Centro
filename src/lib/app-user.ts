import { cache } from "react";

import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const getCurrentAppUser = cache(async () => {
  const auth = await getAuthenticatedUser();
  if (!auth.ok) return null;

  return db.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
    },
  });
});
