import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

interface FailedAttempt {
  count: number;
  firstAttempt: number;
}

const failedAttempts = new Map<string, FailedAttempt>();
const THROTTLE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

function checkThrottle(email: string): { throttled: boolean; message?: string } {
  const now = Date.now();
  const record = failedAttempts.get(email);

  if (!record) {
    return { throttled: false };
  }

  if (now - record.firstAttempt > THROTTLE_WINDOW_MS) {
    failedAttempts.delete(email);
    return { throttled: false };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const remainingMs = THROTTLE_WINDOW_MS - (now - record.firstAttempt);
    const remainingMin = Math.ceil(remainingMs / 60000);
    return {
      throttled: true,
      message: `Too many attempts. Try again in ${remainingMin} minutes.`,
    };
  }

  return { throttled: false };
}

function recordFailure(email: string): void {
  const now = Date.now();
  const record = failedAttempts.get(email);

  if (!record || now - record.firstAttempt > THROTTLE_WINDOW_MS) {
    failedAttempts.set(email, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function recordSuccess(email: string): void {
  failedAttempts.delete(email);
}

export async function authorizeCredentials(
  credentials: unknown,
): Promise<{ user?: User; error?: string }> {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const throttle = checkThrottle(normalizedEmail);
  if (throttle.throttled) {
    return { error: throttle.message ?? "Too many attempts. Try again later." };
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.passwordHash) {
    recordFailure(normalizedEmail);
    return { error: "Invalid email or password." };
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    recordFailure(normalizedEmail);
    return { error: "Invalid email or password." };
  }

  recordSuccess(normalizedEmail);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export const authConfig = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/settings/accounts",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = await authorizeCredentials(credentials);
        return result.user ?? null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
