import { Logger, createLogger, format } from "winston";

import { consoleTransport, fileTransport } from "./transports";
import chalk from "chalk";

export function prettyLog(prefix: string, ...args: unknown[]) {
  console.log.apply(console.log, [chalk.green(prefix), ...args]);
}

let loggerInstance: Logger | null = null;

export function logger(): Logger {
  if (loggerInstance) return loggerInstance;

  loggerInstance = createLogger({
    level: "info",
    format: format.errors({ stack: true }),
    transports: [consoleTransport, fileTransport],
    exitOnError: false,
  });

  return loggerInstance;
}
