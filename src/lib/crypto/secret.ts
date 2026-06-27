import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

export type Encrypted = { ct: string; iv: string; tag: string };

function getKey(): Buffer {
  const raw = process.env.MIP_ENCRYPTION_KEY;
  if (!raw) throw new Error("MIP_ENCRYPTION_KEY ortam değişkeni tanımlı değil");
  // Deterministically derive a 32-byte key from the configured secret.
  return scryptSync(raw, "mip-infra-key-v1", 32);
}

export function encrypt(plaintext: string): Encrypted {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ct: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decrypt(enc: Encrypted): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(enc.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(enc.tag, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(enc.ct, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}

export function isEncrypted(value: unknown): value is Encrypted {
  return (
    !!value &&
    typeof value === "object" &&
    "ct" in value &&
    "iv" in value &&
    "tag" in value
  );
}
