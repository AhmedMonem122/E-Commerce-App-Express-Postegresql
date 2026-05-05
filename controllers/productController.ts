import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import admin from "../config/firebase";

// ✅ IMPORT FACTORY (PRISMA VERSION)
import { getAll, getOne, addOne, updateOne, deleteOne } from "./handlerFactory";

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
export const uploadProductImagesToFirebase = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as {
      imageCover?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };

    if (!files?.imageCover || !files?.images) return next();

    // cover
    const cover = files.imageCover[0];

    const coverName = `Products/product-${req.params.id || ""}-${
      cover.originalname
    }-cover-${Date.now()}`;

    const coverRef = storage.file(coverName);

    await coverRef.save(cover.buffer, {
      metadata: { contentType: cover.mimetype },
    });

    const coverURL = `https://firebasestorage.googleapis.com/v0/b/${
      process.env.FIREBASE_STORAGE_BUCKET
    }/o/${encodeURIComponent(coverName)}?alt=media`;

    // images
    const imagesURLs = await Promise.all(
      files.images.map(async (file, i) => {
        const name = `Products/product-${req.params.id || ""}-${
          file.originalname
        }-${Date.now()}-${i}`;

        const ref = storage.file(name);

        await ref.save(file.buffer, {
          metadata: { contentType: file.mimetype },
        });

        return `https://firebasestorage.googleapis.com/v0/b/${
          process.env.FIREBASE_STORAGE_BUCKET
        }/o/${encodeURIComponent(name)}?alt=media`;
      }),
    );

    req.body.imageCover = coverURL;
    req.body.images = imagesURLs;

    next();
  },
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
