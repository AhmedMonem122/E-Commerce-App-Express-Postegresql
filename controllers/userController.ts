import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import * as factory from "./handlerFactory.js";
import admin from "../config/firebase.js";
import { prisma } from "../prisma/client.js";

const storage = admin.storage().bucket();

const multerStorage = multer.memoryStorage();

const multerFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single("photo");

export const uploadUserPhotoToFirebase = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file || !req.user) return next();

    const file = req.file;

    const safeUserName = req.user.name
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    const filename = `Users/${safeUserName}-${req.user.id}/user-${req.user.id}-${file.originalname}-${Date.now()}`;

    const fileRef = storage.file(filename);

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${
      process.env.FIREBASE_STORAGE_BUCKET
    }/o/${encodeURIComponent(filename)}?alt=media`;

    req.body.photo = downloadURL;

    next();
  },
);

const filterObj = (obj: any, ...allowedFields: string[]) => {
  const newObj: any = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("User not authenticated", 401));
  }

  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates! Please use /updateMyPassword instead.",
          400,
        ),
      );
    }

    const filteredBody = filterObj(req.body, "name", "email", "photo");

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: filteredBody,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  },
);

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { active: false },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  },
);

export const getAllUsers = factory.getAll(prisma.user, "users");
export const getUser = factory.getOne(prisma.user, "user");
export const createUser = factory.addOne(prisma.user, "user");
export const updateUser = factory.updateOne(prisma.user, "user");
export const deleteUser = factory.deleteOne(prisma.user, "user");
