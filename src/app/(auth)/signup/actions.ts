"use server";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerUser(
  formData: unknown,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input. Please check your details.",
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  const passwordHash = await argon2.hash(password);

  await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
    },
  });

  return { success: true };
}
