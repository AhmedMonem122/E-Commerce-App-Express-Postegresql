import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

import catchAsync from "./catchAsync.js";
import AppError from "./appError.js";

export const validate = (schema: ZodType) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(
        new AppError(
          `Validation failed: ${errors
            .map((error) => error.message)
            .join(", ")}`,
          400,
        ),
      );
    }

    req.body = result.data;

    next();
  });
