import type { Request, Response, NextFunction } from "express";

import multer from "multer";

import bcrypt from "bcryptjs";

import AppError from "../utils/appError.js";

import catchAsync from "../utils/catchAsync.js";

import * as factory from "./handlerFactory.js";

import { prisma } from "../prisma/client.js";

import { APIFeatures } from "../utils/apiFeatures.js";

import { supabase } from "../config/supabase.js";

import { deleteSupabaseFiles } from "../utils/supabaseStorage.js";

/* =====================================================
   MULTER
===================================================== */

const multerStorage = multer.memoryStorage();

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const multerFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Not an image! Please upload JPEG, PNG or WEBP images only.",
        400,
      ),
    );
  }
};

const upload = multer({
  storage: multerStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single("photo");

/* =====================================================
   UPLOAD USER PHOTO TO SUPABASE
===================================================== */

export const uploadUserPhotoToSupabase = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file || !req.user) {
      return next();
    }

    const file = req.file;

    const safeOriginalName = file.originalname.replace(/[^\w.-]/g, "-");

    const filename =
      `Users/user-${req.user.id}-` + `${Date.now()}-${safeOriginalName}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      return next(error);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(filename);

    req.body.photo = publicUrl;

    next();
  },
);

/* =====================================================
   FILTER OBJECT
===================================================== */

const filterObj = (obj: any, ...allowedFields: string[]) => {
  const newObj: any = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

/* =====================================================
   SAFE USER SELECT
===================================================== */

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  photo: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

/* =====================================================
   GET ME
===================================================== */

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("User not authenticated", 401));
  }

  req.params.id = req.user.id;

  next();
};

/* =====================================================
   UPDATE ME
===================================================== */

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

    /*
     * Get old photo before updating
     */

    const oldUser = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },

      select: {
        photo: true,
      },
    });

    if (!oldUser) {
      return next(new AppError("User not found", 404));
    }

    const filteredBody = filterObj(req.body, "name", "email", "photo");

    if (filteredBody.name !== undefined) {
      filteredBody.name = filteredBody.name.trim();
    }

    if (filteredBody.email !== undefined) {
      filteredBody.email = filteredBody.email.trim().toLowerCase();
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },

      data: filteredBody,

      select: safeUserSelect,
    });

    /*
     * Delete old photo only if
     * a new photo was uploaded
     */

    if (filteredBody.photo !== undefined && oldUser.photo) {
      try {
        await deleteSupabaseFiles(
          [oldUser.photo],
          process.env.SUPABASE_BUCKET!,
        );
      } catch (error) {
        console.error("Failed to delete old user photo from Supabase:", error);
      }
    }

    res.status(200).json({
      status: "success",

      data: {
        user: updatedUser,
      },
    });
  },
);

/* =====================================================
   DELETE ME
   Soft delete / deactivate
===================================================== */

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    await prisma.user.update({
      where: {
        id: req.user.id,
      },

      data: {
        active: false,
      },
    });

    res.status(204).send();
  },
);

/* =====================================================
   GET ALL USERS - ADMIN
===================================================== */

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const features = new APIFeatures(req.query)
      .filter()
      .search(["name", "email"])
      .sort()
      .paginate();

    const options = features.build();

    /*
     * We intentionally don't use
     * options.select here.
     *
     * User responses must always
     * use our safe whitelist.
     */

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: options.where,

        orderBy: options.orderBy,

        skip: options.skip,

        take: options.take,

        select: safeUserSelect,
      }),

      prisma.user.count({
        where: options.where,
      }),
    ]);

    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 40;

    const numberOfPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",

      results: total,

      currentResults: users.length,

      metadata: {
        currentPage: page,

        numberOfPages,

        limit,

        prevPage: page === 1 ? undefined : page - 1,

        nextPage: page >= numberOfPages ? undefined : page + 1,
      },

      data: {
        users,
      },
    });
  },
);

/* =====================================================
   GET USER - ADMIN
===================================================== */

export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id as string,
      },

      select: safeUserSelect,
    });

    if (!user) {
      return next(new AppError("There is no user with that id!", 404));
    }

    res.status(200).json({
      status: "success",

      data: {
        user,
      },
    });
  },
);

/* =====================================================
   CREATE USER - ADMIN
===================================================== */

export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role, photo, active } = req.body;

    if (!name || !email || !password) {
      return next(new AppError("Please provide name, email and password", 400));
    }

    if (password.length < 8) {
      return next(new AppError("Password must be at least 8 characters", 400));
    }

    const normalizedEmail = email.trim().toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),

        email: normalizedEmail,

        password: hashedPassword,

        role: role === "ADMIN" ? "ADMIN" : "USER",

        photo: photo || null,

        active: active !== undefined ? Boolean(active) : true,
      },

      select: safeUserSelect,
    });

    res.status(201).json({
      status: "success",

      data: {
        user,
      },
    });
  },
);

/* =====================================================
   UPDATE USER - ADMIN
===================================================== */

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    /*
     * Get old photo before update
     */

    const oldUser = await prisma.user.findUnique({
      where: {
        id: req.params.id as string,
      },

      select: {
        photo: true,
      },
    });

    if (!oldUser) {
      return next(new AppError("There is no user with that id!", 404));
    }

    const { name, email, password, role, photo, active } = req.body;

    const data: any = {};

    if (name !== undefined) {
      data.name = name.trim();
    }

    if (email !== undefined) {
      data.email = email.trim().toLowerCase();
    }

    if (password !== undefined) {
      if (password.length < 8) {
        return next(
          new AppError("Password must be at least 8 characters", 400),
        );
      }

      data.password = await bcrypt.hash(password, 12);

      data.passwordChangedAt = new Date();
    }

    if (role !== undefined) {
      if (role !== "USER" && role !== "ADMIN") {
        return next(new AppError("Role must be USER or ADMIN", 400));
      }

      data.role = role;
    }

    if (photo !== undefined) {
      data.photo = photo;
    }

    if (active !== undefined) {
      data.active = Boolean(active);
    }

    const user = await prisma.user.update({
      where: {
        id: req.params.id as string,
      },

      data,

      select: safeUserSelect,
    });

    /*
     * Delete old photo only if
     * a new photo was provided
     */

    if (data.photo !== undefined && oldUser.photo) {
      try {
        await deleteSupabaseFiles(
          [oldUser.photo],
          process.env.SUPABASE_BUCKET!,
        );
      } catch (error) {
        console.error("Failed to delete old user photo from Supabase:", error);
      }
    }

    res.status(200).json({
      status: "success",

      data: {
        user,
      },
    });
  },
);

/* =====================================================
   DELETE USER - ADMIN
===================================================== */

export const deleteUser = factory.deleteOne(
  prisma.user,
  "user",

  (user) => {
    return user.photo ? [user.photo] : [];
  },

  process.env.SUPABASE_BUCKET!,
);
