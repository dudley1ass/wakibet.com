import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "./prisma.js";
import { verifyAccessToken } from "./jwt.js";

export type AuthUser = {
  id: string;
  displayName: string;
  email: string;
  region: string | null;
  country: string;
  createdAt: Date;
};

declare module "fastify" {
  interface FastifyRequest {
    /** Set by `requireAuthUser` after a valid Bearer token and non-banned user. */
    authUser?: AuthUser;
  }
}

/** Fastify `preHandler`: verifies JWT, loads user, sets `req.authUser` or sends 401. */
export async function requireAuthUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith("Bearer ")) {
    await reply.code(401).send({ message: "Missing bearer token." } as const);
    return;
  }
  let sub: string;
  try {
    ({ sub } = verifyAccessToken(hdr.slice(7)));
  } catch {
    await reply.code(401).send({ message: "Invalid or expired token." } as const);
    return;
  }
  const row = await prisma.user.findUnique({
    where: { id: sub },
    select: {
      id: true,
      displayName: true,
      email: true,
      region: true,
      country: true,
      createdAt: true,
      isBanned: true,
    },
  });
  if (!row || row.isBanned) {
    await reply.code(401).send({ message: "Invalid or expired token." } as const);
    return;
  }
  req.authUser = {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    region: row.region,
    country: row.country,
    createdAt: row.createdAt,
  };
}
