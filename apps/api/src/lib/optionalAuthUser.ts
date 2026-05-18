import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "./prisma.js";
import type { AuthUser } from "./requireAuthUser.js";
import { verifyAccessToken } from "./jwt.js";

/** Sets `req.authUser` when a valid Bearer token is present; otherwise continues without auth. */
export async function optionalAuthUser(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith("Bearer ")) return;
  let sub: string;
  try {
    ({ sub } = verifyAccessToken(hdr.slice(7)));
  } catch {
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
  if (!row || row.isBanned) return;
  const authUser: AuthUser = {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    region: row.region,
    country: row.country,
    createdAt: row.createdAt,
  };
  req.authUser = authUser;
}
