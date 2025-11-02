import dotenv from "dotenv";

import { Command } from "commander";
import { createCryptoCommands } from "./crypto.commands";

async function boot() {
  dotenv.config({ path: ".env" });

  // const ioc: Container = await constructIOC()

  const program = new Command();

  program.command("test").action(async () => {
    console.log("Running tests...");
  });

  // Define CLI commands here
  createCryptoCommands(program);

  await program.parseAsync();
  process.exit(0);
}

boot().catch(console.error);
