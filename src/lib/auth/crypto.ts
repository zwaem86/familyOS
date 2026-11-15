import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, verify, argon2id } from "argon2";
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export const equalSecret = (a: string, b: string) =>
  timingSafeEqual(
    Buffer.from(tokenHash(a), "hex"),
    Buffer.from(tokenHash(b), "hex"),
  );
export const hashPassword = (password: string) =>
  hash(password, {
    type: argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
export const verifyPassword = (encoded: string, password: string) =>
  verify(encoded, password);
