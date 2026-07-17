import { getAuthenticatedUser } from "@/lib/auth";
import { createAccountRouteHandlers } from "@/lib/accounts/route-handlers";
import { db } from "@/lib/db";

const handlers = createAccountRouteHandlers({
  getAuthenticatedUser,
  socialAccounts: db.socialAccount,
});

export const { DELETE } = handlers;
