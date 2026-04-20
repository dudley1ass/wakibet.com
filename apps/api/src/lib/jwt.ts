import jwt from "jsonwebtoken";

const ISS = "wakibet-api";

export function getJwtSecret(): string {
  const s = process.env.WAKIBET_JWT_SECRET ?? process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("WAKIBET_JWT_SECRET or JWT_SECRET must be set in production");
    }
    return "dev-only-insecure-jwt-secret-change-me";
  }
  return s;
}

export function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, getJwtSecret(), {
    expiresIn: "7d",
    issuer: ISS,
  });
}

export function verifyAccessToken(token: string): { sub: string; email: string } {
  const payload = jwt.verify(token, getJwtSecret(), { issuer: ISS }) as jwt.JwtPayload;
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }
  return { sub: payload.sub, email: payload.email };
}
