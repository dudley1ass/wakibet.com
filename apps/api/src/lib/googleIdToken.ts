export type GoogleTokenPayload = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("Google sign-in is not configured on the server.");
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) {
    throw new Error("Invalid Google sign-in token.");
  }

  const data = (await res.json()) as Record<string, string>;
  if (data.aud !== clientId) {
    throw new Error("Google token audience mismatch.");
  }
  if (data.email_verified !== "true") {
    throw new Error("Google account email is not verified.");
  }
  if (!data.email || !data.sub) {
    throw new Error("Google token missing required fields.");
  }

  return {
    sub: data.sub,
    email: data.email.toLowerCase(),
    email_verified: true,
    name: data.name,
    picture: data.picture,
  };
}
