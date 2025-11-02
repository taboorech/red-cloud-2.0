import { prettyLog } from "@app/lib/logger";
import { Command } from "commander";
import * as jose from "jose";
import * as bcrypt from "bcrypt";

// eslint-disable-next-line unused-imports/no-unused-vars
export function createCryptoCommands(program: Command) {
  program.command("crypto:generate-encryption-key").action(async () => {
    const secret = await jose.generateSecret(process.env.CRYPTO_ALGORITHM!, {
      extractable: true,
    });
    const jwk = await jose.exportJWK(secret);

    prettyLog("Generated new encryption key (JWK format):", jwk);
    prettyLog(
      "Generated new encryption key (Base64 format):",
      Buffer.from(JSON.stringify(jwk)).toString("base64"),
    );
  });

  program
    .command("crypto:hash-password <password>")
    .action(async (password) => {
      const hashedPassword = await bcrypt.hash(
        password,
        parseInt(process.env.BCRYPT_SALT_ROUNDS || "10"),
      );
      prettyLog("Hashed password:", hashedPassword);
    });
}
