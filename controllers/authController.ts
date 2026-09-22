import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import Email from "../utils/email.js";
import { prisma } from "../prisma/client.js";

import {
  changedPasswordAfter,
  correctPassword,
} from "../services/userService.js";

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

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: safeUser,
    },
  });
};

/* =====================================================
   REGISTER
===================================================== */

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, passwordConfirm, url } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
      return next(
        new AppError(
          "Please provide name, email, password and passwordConfirm",
          400,
        ),
      );
    }

    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match", 400));
    }

    if (password.length < 8) {
      return next(new AppError("Password must be at least 8 characters", 400));
    }

    const normalizedEmail = email.trim().toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    await new Email(newUser, url || "").sendWelcome();

    createSendToken(newUser, 201, res);
  },
);

/* =====================================================
   LOGIN
===================================================== */

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user || !(await correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    /*
      If the user previously used deleteMe,
      the account is only deactivated.

      Logging in again reactivates the account.
    */
    if (!user.active) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          active: true,
        },
      });

      user.active = true;
    }

    createSendToken(user, 200, res);
  },
);

/* =====================================================
   PROTECT
===================================================== */

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
        if (err) {
          return reject(err);
        }

        resolve(decoded as DecodedToken);
      });
    });

    const currentUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
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

    /*
      If the user deactivated the account,
      an old token should not keep working.

      They need to login again.
    */
    if (!currentUser.active) {
      return next(
        new AppError("Your account is inactive. Please login again.", 401),
      );
    }

    req.user = currentUser;

    next();
  },
);

/* =====================================================
   RESTRICT TO
===================================================== */

export const restrictTo = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("No permission", 403));
    }

    next();
  };
};

/* =====================================================
   FORGOT PASSWORD
===================================================== */

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return next(new AppError("Please provide your email", 400));
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    /*
      Do not reveal whether the email exists.
    */
    if (!user) {
      return res.status(200).json({
        status: "success",
        message: "If this email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetToken: hashedToken,

        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const resetURL =
      `${req.protocol}://${req.get("host")}` +
      `/api/v1/users/resetPassword/${resetToken}`;

    try {
      await new Email(user, resetURL).sendPasswordReset();

      return res.status(200).json({
        status: "success",
        message: "If this email exists, a password reset link has been sent.",
      });
    } catch {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      return next(new AppError("Email failed", 500));
    }
  },
);

/* =====================================================
   RESET PASSWORD
===================================================== */

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      return next(
        new AppError("Please provide password and passwordConfirm", 400),
      );
    }

    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match", 400));
    }

    if (password.length < 8) {
      return next(new AppError("Password must be at least 8 characters", 400));
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token as string)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,

        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return next(new AppError("Token invalid or expired", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedPassword,

        passwordResetToken: null,

        passwordResetExpires: null,

        passwordChangedAt: new Date(),

        active: true,
      },
    });

    createSendToken(updatedUser, 200, res);
  },
);

/* =====================================================
   UPDATE PASSWORD
===================================================== */

export const updatePassword = catchAsync(
  async (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not logged in", 401));
    }

    const { passwordCurrent, password, passwordConfirm } = req.body;

    if (!passwordCurrent || !password || !passwordConfirm) {
      return next(
        new AppError(
          "Please provide current password, new password and passwordConfirm",
          400,
        ),
      );
    }

    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match", 400));
    }

    if (password.length < 8) {
      return next(new AppError("Password must be at least 8 characters", 400));
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const isCorrect = await correctPassword(passwordCurrent, user.password);

    if (!isCorrect) {
      return next(new AppError("Wrong password", 401));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedPassword,

        passwordChangedAt: new Date(),
      },
    });

    createSendToken(updatedUser, 200, res);
  },
);
