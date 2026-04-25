import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import Email from "../utils/email";

import { prisma } from "../prisma/client";
import { changedPasswordAfter, correctPassword } from "../services/userService";

interface DecodedToken extends JwtPayload {
  id: string;
  iat: number;
}

const signToken = (payload: object): string => {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN as any,
  };

  return jwt.sign(payload, process.env.JWT_SECRET as string, options);
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  const cookieOptions: any = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: "lax",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user: safeUser },
  });
};

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, passwordConfirm, url } = req.body;

    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await new Email(newUser, url || "").sendWelcome();

    createSendToken(newUser, 201, res);
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    createSendToken(user, 200, res);
  },
);

export const protect = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Not logged in", 401));
    }

    const decoded = await new Promise<DecodedToken>((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as DecodedToken);
      });
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(new AppError("User no longer exists", 401));
    }

    if (!decoded.iat) {
      return next(new AppError("Invalid token", 401));
    }

    if (changedPasswordAfter(currentUser.passwordChangedAt, decoded.iat)) {
      return next(new AppError("Password changed recently. Login again.", 401));
    }

    req.user = currentUser;
    next();
  },
);

export const restrictTo = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("No permission", 403));
    }
    next();
  };
};

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (!user) {
      return next(new AppError("No user found", 404));
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    try {
      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: "success",
        message: "Token sent",
      });
    } catch {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      return next(new AppError("Email failed", 500));
    }
  },
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token as string)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return next(new AppError("Token invalid or expired", 400));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    createSendToken(updatedUser, 200, res);
  },
);

export const updatePassword = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Not logged in", 401));

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return next(new AppError("User not found", 404));

    const isCorrect = await correctPassword(
      req.body.passwordCurrent,
      user.password,
    );

    if (!isCorrect) {
      return next(new AppError("Wrong password", 401));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    createSendToken(updatedUser, 200, res);
  },
);
