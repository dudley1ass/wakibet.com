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

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        return reply.code(503).send({
          message: "Contact service is temporarily unavailable. Please email support@wakibet.com.",
        } as const);
      }

      const toEmail = process.env.SUPPORT_EMAIL || "support@wakibet.com";
      const fromEmail = process.env.CONTACT_FROM_EMAIL || "WakiBet Contact <onboarding@resend.dev>";
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
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        <p><strong>Subject:</strong> ${body.subject}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space: pre-wrap; font-family: inherit;">${body.message}</pre>
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
        req.log.error({ status: res.status }, "Resend send failed");
        return reply.code(503).send({
          message: "Could not send your message right now. Please try again shortly.",
        } as const);
      }

      return {
        ok: true,
        message: "Thanks for contacting us. We will get back to you soon.",
      };
    },
  );
};
