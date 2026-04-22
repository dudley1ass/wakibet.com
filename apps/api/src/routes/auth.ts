import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { SIGNUP_BONUS_DILLS } from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { signAccessToken, verifyAccessToken } from "../lib/jwt.js";

async function sendNewAccountAlert(params: {
  email: string;
  displayName: string;
  userId: string;
  state: string;
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;

  const toEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SUPPORT_EMAIL || "support@wakibet.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "WakiBet Contact <onboarding@resend.dev>";

  const text = [
    "New WakiBet account created",
    "",
    `User ID: ${params.userId}`,
    `Display name: ${params.displayName}`,
    `Email: ${params.email}`,
    `State: ${params.state}`,
    `Created at: ${new Date().toISOString()}`,
  ].join("\n");

  const html = `
    <h2>New WakiBet account created</h2>
    <p><strong>User ID:</strong> ${params.userId}</p>
    <p><strong>Display name:</strong> ${params.displayName}</p>
    <p><strong>Email:</strong> ${params.email}</p>
    <p><strong>State:</strong> ${params.state}</p>
    <p><strong>Created at:</strong> ${new Date().toISOString()}</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: "[WakiBet] New account created",
        text,
        html,
      }),
    });
    if (!res.ok) {
      // Best-effort notification: never block account creation.
      console.error("new-account-alert failed", res.status);
    }
  } catch (err) {
    // Best-effort notification: never block account creation.
    console.error("new-account-alert error", err);
  }
}

async function pickUsername(email: string): Promise<string> {
  const local = (email.split("@")[0] || "user").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "user";
  for (let i = 0; i < 12; i++) {
    const candidate = i === 0 ? local : `${local}_${i}`;
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }
  return `${local}_${Date.now().toString(36)}`;
}

function parseDob(dob: string): Date {
  const d = new Date(`${dob}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date of birth");
  }
  return d;
}

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  dob: z.string().min(8),
  state: z.string().min(2).max(8),
  display_name: z.string().max(80).optional(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    "/api/v1/auth/register",
    {
      schema: {
        tags: ["auth"],
        body: RegisterBody,
      },
    },
    async (req, reply) => {
      const { email, password, dob, state, display_name } = req.body;
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return reply.code(409).send({ message: "An account with this email already exists." } as const);
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const dateOfBirth = parseDob(dob);
      const username = await pickUsername(email);
      const displayName = (display_name?.trim() || email.split("@")[0] || "Player").slice(0, 80);
      const bonus = new Prisma.Decimal(SIGNUP_BONUS_DILLS);

      const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            username,
            passwordHash,
            displayName,
            dateOfBirth,
            country: "US",
            region: state,
          },
        });
        const w = await tx.wallet.create({
          data: {
            userId: u.id,
            cachedBalance: bonus,
            currency: "DILLS",
          },
        });
        await tx.walletLedger.create({
          data: {
            walletId: w.id,
            type: "SIGNUP_BONUS",
            amount: bonus,
            balanceAfter: bonus,
            idempotencyKey: `signup-bonus:${u.id}`,
          },
        });
        return u;
      });

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
      const virtual_cents = Math.round(Number(wallet.cachedBalance) * 100);
      const access_token = signAccessToken(user.id, user.email);
      void sendNewAccountAlert({
        email: user.email,
        displayName: user.displayName,
        userId: user.id,
        state,
      });
      return {
        access_token,
        user: {
          user_id: user.id,
          email: user.email,
          display_name: user.displayName,
          virtual_cents,
        },
      };
    },
  );

  typed.post(
    "/api/v1/auth/login",
    {
      schema: {
        tags: ["auth"],
        body: LoginBody,
      },
    },
    async (req, reply) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.code(401).send({ message: "Invalid email or password." } as const);
      }
      if (user.isBanned) {
        return reply.code(401).send({ message: "Account is suspended." } as const);
      }
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      const virtual_cents = wallet ? Math.round(Number(wallet.cachedBalance) * 100) : 0;
      const access_token = signAccessToken(user.id, user.email);
      return {
        access_token,
        user: {
          user_id: user.id,
          email: user.email,
          display_name: user.displayName,
          virtual_cents,
        },
      };
    },
  );

  typed.get(
    "/api/v1/auth/me",
    {
      schema: {
        tags: ["auth"],
      },
    },
    async (req, reply) => {
      const hdr = req.headers.authorization;
      if (!hdr?.startsWith("Bearer ")) {
        return reply.code(401).send({ message: "Missing bearer token." } as const);
      }
      let payload: { sub: string; email: string };
      try {
        payload = verifyAccessToken(hdr.slice(7));
      } catch {
        return reply.code(401).send({ message: "Invalid or expired token." } as const);
      }
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.isBanned) {
        return reply.code(401).send({ message: "Invalid or expired token." } as const);
      }
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      const virtual_cents = wallet ? Math.round(Number(wallet.cachedBalance) * 100) : 0;
      return {
        user_id: user.id,
        email: user.email,
        display_name: user.displayName,
        virtual_cents,
      };
    },
  );
};
