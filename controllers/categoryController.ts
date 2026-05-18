import multer from "multer";
import admin from "../config/firebase";
import AppError from "../utils/appError";

// ✅ Prisma Client
import { prisma } from "../prisma/client";

// ✅ Prisma Handler Factory
import {
  getAll,
  getOne,
  addOne,
  updateOne,
  deleteOne,
  uploadImageToSupabase,
} from "./handlerFactory";

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

export const addCategory = addOne(prisma.category, "category");

export const updateCategory = updateOne(prisma.category, "category");

export const deleteCategory = deleteOne(prisma.category, "category");
