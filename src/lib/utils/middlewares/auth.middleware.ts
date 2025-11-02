import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { AppError } from "@app/lib/errors/app.error";
import { JwtPayload } from "@app/lib/types/credentials";
import { ExtendedError, Socket } from "socket.io";

const authMiddleware = ({ strict = false }: { strict?: boolean }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      if (strict) {
        return next(new AppError(401, "There is no token in header"));
      } else {
        return next();
      }
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const user = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as JwtPayload;
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(
          new AppError(401, "Token has expired. Please log in again."),
        );
      } else if (error instanceof JsonWebTokenError) {
        return next(new AppError(401, "Invalid token. Please log in again."));
      } else {
        return next(
          new AppError(500, "Authentication error. Please try again later."),
        );
      }
    }
  };
};

const socketAuthMiddleware = ({ strict = false }: { strict?: boolean }) => {
  return async (socket: Socket, next: (err?: ExtendedError) => void) => {
    const authHeader =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      if (strict) {
        return next(new AppError(401, "There is no token in header"));
      } else {
        return next();
      }
    }

    const token = authHeader.replace("Bearer ", "");

    try {
      const user = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!,
      ) as JwtPayload;
      socket.handshake.auth.user = user;
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(
          new AppError(401, "Token has expired. Please log in again."),
        );
      } else if (error instanceof JsonWebTokenError) {
        return next(new AppError(401, "Invalid token. Please log in again."));
      } else {
        return next(
          new AppError(500, "Authentication error. Please try again later."),
        );
      }
    }
  };
};

const refreshMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "There is no refresh token in header"));
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as JwtPayload;

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new AppError(401, "Refresh token has expired."));
    } else if (error instanceof JsonWebTokenError) {
      return next(new AppError(401, "Invalid refresh token."));
    } else {
      return next(new AppError(500, "Refresh authentication error."));
    }
  }
};

export { authMiddleware, socketAuthMiddleware, refreshMiddleware };
