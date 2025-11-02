import { format, transports } from "winston";

export const consoleTransport = new transports.Console({
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
    format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level}: ${message}`;
    }),
  ),
});

export const fileTransport = new transports.File({
  filename: "logs/app.log",
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
});
