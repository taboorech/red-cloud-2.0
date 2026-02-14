import nodemailer from "nodemailer";

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: Buffer.from(
      process.env.SMTP_PASSWORD_BASE64 || "",
      "base64",
    ).toString("utf-8"),
  },
  requireTLS: true,
  connectionTimeout: 10000,
  socketTimeout: 10000,
};

let transporter: nodemailer.Transporter | null = null;

const mailerTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);

    transporter.verify((error) => {
      if (error) {
        console.error("SMTP connection error:", error);
      } else {
        console.log("SMTP server is ready to take messages");
      }
    });
  }

  return transporter;
};

export { mailerTransporter };
