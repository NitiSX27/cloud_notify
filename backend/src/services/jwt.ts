import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role, User } from "../generated/prisma/client";

export type AccessTokenPayload = {
  id: string;
  email: string;
  role: Role;
};

export type RefreshTokenPayload = {
  id: string;
};

function signToken(payload: object, secret: string, expiresIn: string) {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };

  return jwt.sign(payload, secret, options);
}

export function generateAccessToken(user: Pick<User, "id" | "email" | "role">) {
  return signToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    env.ACCESS_TOKEN_EXPIRY,
  );
}

export function generateRefreshToken(user: Pick<User, "id">) {
  return signToken(
    {
      id: user.id,
    },
    env.JWT_REFRESH_SECRET,
    env.REFRESH_TOKEN_EXPIRY,
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
