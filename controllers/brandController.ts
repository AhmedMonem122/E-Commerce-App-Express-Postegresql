import multer from "multer";
import admin from "../config/firebase";
import AppError from "../utils/appError";
import { prisma } from "../prisma/client";

// ✅ PRISMA HANDLER FACTORY
import {
  getAll,
  getOne,
  addOne,
  updateOne,
  deleteOne,
  uploadImageToFirebase,
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
export const uploadBrandImage = upload.single("image");

export const uploadBrandImageToFirebase = uploadImageToFirebase(
  "Brands",
  storage,
);

// ==============================
// CRUD OPERATIONS
// ==============================

export const getAllBrands = getAll(prisma.brand, "brands");

export const getSpecificBrand = getOne(prisma.brand, "brand", {
  include: {
    category: true,
    products: true,
  },
});

export const addBrand = addOne(prisma.brand, "brand");

export const updateBrand = updateOne(prisma.brand, "brand");

export const deleteBrand = deleteOne(prisma.brand, "brand");
