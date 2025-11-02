import * as jose from "jose";

export async function encryptText(
  text: string,
  headers?: Record<string, unknown>,
): Promise<string> {
  const jwkString = Buffer.from(process.env.MASTER_KEY_JWK!, "base64").toString(
    "utf-8",
  );
  const newJwk = JSON.parse(jwkString);

  const key = await jose.importJWK(
    newJwk,
    process.env.CRYPTO_ALGORITHM || "A256GCM",
  );

  const plaintext = new TextEncoder().encode(text);
  const jwe = await new jose.CompactEncrypt(plaintext)
    .setProtectedHeader({
      alg: "dir",
      enc: process.env.CRYPTO_ALGORITHM || "A256GCM",
      ...headers,
    })
    .encrypt(key);

  return jwe;
}

export async function decryptText(text: string): Promise<string> {
  const jwkString = Buffer.from(process.env.MASTER_KEY_JWK!, "base64").toString(
    "utf-8",
  );
  const newJwk = JSON.parse(jwkString);

  const key = await jose.importJWK(
    newJwk,
    process.env.CRYPTO_ALGORITHM || "A256GCM",
  );
  const { plaintext: decrypted } = await jose.compactDecrypt(text, key);
  const decryptedText = new TextDecoder().decode(decrypted).trim();

  return decryptedText;
}
