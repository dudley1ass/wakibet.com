import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const ContactTopic = z.enum([
  "General Support",
  "Fantasy Scoring Issue",
  "Tournament Data",
  "Report a Bug",
  "Partnership / Promo",
]);

const ContactBody = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  topic: ContactTopic.optional(),
  subject: z.string().min(3).max(160),
  message: z.string().min(10).max(5000),
});

const ContactResponse = z.object({
  ok: z.literal(true),
  message: z.string(),
});

const ErrorMessage = z.object({ message: z.string() });

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_PER_WINDOW = 5;
const rateByKey = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(ip: string, email: string): string {
  return `${ip}::${email.toLowerCase()}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const row = rateByKey.get(key);
  if (!row || now > row.resetAt) {
    rateByKey.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  row.count += 1;
  return row.count > RATE_MAX_PER_WINDOW;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SUPPORT_FALLBACK = "support@wakibet.com";

/** Shown to visitors; operator hints go to logs only. */
const CONTACT_MAIL_DOWN_MESSAGE = `We could not deliver through email right now. Please write to ${SUPPORT_FALLBACK} with the same details.`;

function operatorHintForResendFailure(resendStatus: number, resendMessage: string): string | undefined {
  const m = resendMessage.toLowerCase();
  if (resendStatus === 403 && (m.includes("domain") || m.includes("verify") || m.includes("not allowed"))) {
    return "Verify your sending domain in Resend and set CONTACT_FROM_EMAIL to an address on that domain.";
  }
  if (m.includes("testing emails") || m.includes("onboarding@resend")) {
    return "Resend test sender (onboarding@resend.dev) only delivers to approved addresses until a domain is verified; set CONTACT_FROM_EMAIL after verifying the domain.";
  }
  return undefined;
}

export const publicContactRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    "/api/v1/public/contact",
    {
      schema: {
        tags: ["public"],
        body: ContactBody,
        response: {
          200: ContactResponse,
          400: ErrorMessage,
          429: ErrorMessage,
          503: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const body = req.body;
      const key = rateLimitKey(req.ip, body.email);
      if (isRateLimited(key)) {
        return reply.code(429).send({
          message: "Too many contact requests. Please wait a bit and try again.",
        } as const);
      }

      const resendApiKey = process.env.RESEND_API_KEY?.trim();
      if (!resendApiKey) {
        return reply.code(503).send({
          message: `Contact email is not configured on the server. Please write to ${SUPPORT_FALLBACK} directly.`,
        } as const);
      }

      const toEmail = (process.env.SUPPORT_EMAIL || SUPPORT_FALLBACK).trim();
      const fromEmail =
        (process.env.CONTACT_FROM_EMAIL || "WakiBet Contact <onboarding@resend.dev>").trim();
      const topic = body.topic || "General Support";

      const text = [
        "New WakiBet contact submission",
        "",
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        `Topic: ${topic}`,
        `Subject: ${body.subject}`,
        "",
        "Message:",
        body.message,
      ].join("\n");

      const html = `
        <h2>New WakiBet contact submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(body.subject)}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(body.message)}</pre>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: body.email,
          subject: `[WakiBet Contact] ${body.subject}`,
          text,
          html,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        let resendMessage = "";
        try {
          const j = JSON.parse(raw) as { message?: string };
          if (typeof j.message === "string") resendMessage = j.message;
        } catch {
          resendMessage = raw.slice(0, 200);
        }
        const operatorHint = operatorHintForResendFailure(res.status, resendMessage);
        req.log.error(
          {
            status: res.status,
            resendMessage,
            toEmail,
            fromPreview: fromEmail.slice(0, 80),
            ...(operatorHint ? { operatorHint } : {}),
          },
          "Resend send failed",
        );
        return reply.code(503).send({
          message: CONTACT_MAIL_DOWN_MESSAGE,
        } as const);
      }

      return {
        ok: true,
        message: "Thanks for contacting us. We will get back to you soon.",
      };
    },
  );
};
