import { JwtPayload } from "@app/lib/types/credentials";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}