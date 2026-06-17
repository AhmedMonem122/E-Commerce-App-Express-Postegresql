import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import AppError from "../utils/appError.js";

const handlePrismaKnownError = (err: Prisma.PrismaClientKnownRequestError) => {
  // Unique constraint failed
  if (err.code === "P2002") {
    const target = (err.meta?.target as string[])?.join(", ");
    return new AppError(`Duplicate field value: ${target}`, 400);
  }

  // Record not found
  if (err.code === "P2025") {
    return new AppError("No record found with that ID", 404);
  }

  // Foreign key constraint
  if (err.code === "P2003") {
    return new AppError("Invalid relation reference (foreign key)", 400);
  }

  return new AppError("Database error", 400);
};

const handlePrismaValidationError = () =>
  new AppError("Invalid input data. Please check your request.", 400);

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(Number(err.statusCode) || 500).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(Number(err.statusCode) || 500).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = Number(err.statusCode) || 500;

  err.status = err.status || "error";

  // ==============================
  // DEVELOPMENT
  // ==============================
  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(err, res);
  }

  // ==============================
  // PRODUCTION
  // ==============================
  let error = err;

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaKnownError(err);
  }

  // Prisma validation
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = handlePrismaValidationError();
  }

  // JWT
  if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  }

  if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  sendErrorProd(error, res);
};
