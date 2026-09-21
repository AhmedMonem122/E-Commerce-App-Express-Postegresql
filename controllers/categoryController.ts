import multer from "multer";
import admin from "../config/firebase.js";
import AppError from "../utils/appError.js";

// ✅ Prisma Client
import { prisma } from "../prisma/client.js";

// ✅ Prisma Handler Factory
import {
  getAll,
  getOne,
  addOne,
  updateOne,
  deleteOne,
  uploadImageToSupabase,
} from "./handlerFactory.js";

// ==============================
// FIREBASE STORAGE
// ==============================
const storage = admin.storage().bucket();

// ==============================
// MULTER CONFIG
// ==============================
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

const parseIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, treat it as a single ID
    }

    return [value];
  }

  return [];
};

// ==============================
// IMAGE UPLOAD
// ==============================
export const uploadCategoryImage = upload.single("image");

export const uploadCategoryImageToSupabase = uploadImageToSupabase(
  "Categories",
  "ecommerce",
);

// ==============================
// CRUD OPERATIONS
// ==============================

export const getAllCategories = getAll(prisma.category, "categories");

export const getSpecificCategory = getOne(prisma.category, "category", {
  brands: true,
  products: true,
});

export const addCategory = addOne(prisma.category, "category", (data) => {
  const { brands, products, ...rest } = data;

  return {
    ...rest,

    ...(brands !== undefined && {
      brands: {
        connect: parseIds(brands).map((id) => ({ id })),
      },
    }),

    ...(products !== undefined && {
      products: {
        connect: parseIds(products).map((id) => ({ id })),
      },
    }),
  };
});

export const updateCategory = updateOne(prisma.category, "category", (data) => {
  const { brands, products, ...rest } = data;

  return {
    ...rest,

    ...(brands !== undefined && {
      brands: {
        set: parseIds(brands).map((id) => ({
          id,
        })),
      },
    }),

    ...(products !== undefined && {
      products: {
        set: parseIds(products).map((id) => ({
          id,
        })),
      },
    }),
  };
});

export const deleteCategory = deleteOne(prisma.category, "category");
