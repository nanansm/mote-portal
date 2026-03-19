import { OAuth2Client } from "google-auth-library";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";
import type { JwtPayload } from "../../shared/types";

export const oauthClient = new OAuth2Client(
  ENV.googleClientId,
  ENV.googleClientSecret,
  ENV.googleCallbackUrl
);

const secret = new TextEncoder().encode(ENV.sessionSecret);

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function getGoogleAuthUrl(): string {
  return oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "consent",
  });
}

export async function getGoogleProfile(code: string) {
  const { tokens } = await oauthClient.getToken(code);
  oauthClient.setCredentials(tokens);

  const ticket = await oauthClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: ENV.googleClientId,
  });

  const profilePayload = ticket.getPayload();
  if (!profilePayload) throw new Error("No profile payload");

  return {
    googleId: profilePayload.sub,
    name: profilePayload.name || "",
    email: profilePayload.email || "",
    avatar: profilePayload.picture || null,
  };
}
