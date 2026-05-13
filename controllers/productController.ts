import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import admin from "../config/firebase";

// ✅ IMPORT FACTORY (PRISMA VERSION)
import {
  getAll,
  getOne,
  addOne,
  updateOne,
  deleteOne,
  uploadImageToFirebase,
} from "./handlerFactory";

// ==============================
// FIREBASE
// ==============================
const storage = admin.storage().bucket();

// ==============================
// MULTER SETUP
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

// upload fields
export const uploadProductImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 4 },
]);

// ==============================
// FIREBASE UPLOAD
// ==============================
export const uploadProductImagesToFirebase = uploadImageToFirebase(
  "Products",
  storage,
);

// ==============================
// HELPERS
// ==============================
export const aliasTopProducts = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.query.limit = "5";
  req.query.sort = "ratingsAverage";
  next();
};

export const filterByBrands = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.params.brandId) {
    req.query.brandId = req.params.brandId;
  }
  next();
};

export const filterByCategories = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.params.categoryId) {
    req.query.categoryId = req.params.categoryId;
  }
  next();
};

// ==============================
// STATS (PRISMA)
// ==============================
export const getProductStats = catchAsync(
  async (req: Request, res: Response) => {
    const stats = await prisma.product.aggregate({
      _count: true,
      _avg: {
        price: true,
        ratingsAverage: true,
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { stats },
    });
  },
);

// ==============================
// FACTORY-BASED CRUD
// ==============================

export const getAllProducts = getAll(prisma.product, "products");

export const getSpecificProduct = getOne(prisma.product, "product", {
  brand: true,
  category: true,
  reviews: {
    include: {
      user: {
        select: {
          name: true,
          photo: true,
        },
      },
    },
  },
});

export const addProduct = addOne(prisma.product, "product");

export const updateProduct = updateOne(prisma.product, "product");

export const deleteProduct = deleteOne(prisma.product, "product");
