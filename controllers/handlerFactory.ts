import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { APIFeatures } from "../utils/apiFeatures";

export const getAll = (model: any, modelName: string) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Nested filtering
    let filter: any = {};

    if (req.params.productId) {
      filter = { productId: req.params.productId };
    }

    const features = new APIFeatures(req.query)
      .filter()
      .search(["title", "description"])
      .sort()
      .limitFields()
      .paginate();

    const queryOptions = features.build();

    const [data, total] = await Promise.all([
      model.findMany({
        ...queryOptions,
        where: {
          ...queryOptions.where,
          ...filter,
        },
      }),
      model.count({
        where: {
          ...queryOptions.where,
          ...filter,
        },
      }),
    ]);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 40;
    const numberOfPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      results: total,
      currentResults: data.length,
      metadata: {
        currentPage: page,
        numberOfPages,
        limit,
        prevPage: page === 1 ? undefined : page - 1,
        nextPage: page >= numberOfPages ? undefined : page + 1,
      },
      data: {
        [modelName]: data,
      },
    });
  });

export const getOne = (model: any, modelName: string, include?: any) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await model.findUnique({
      where: { id: req.params.id },
      include,
    });

    if (!doc) {
      return next(new AppError(`There is no ${modelName} with that id!`, 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        [modelName]: doc,
      },
    });
  });

export const addOne = (model: any, modelName: string) =>
  catchAsync(async (req: Request, res: Response) => {
    const doc = await model.create({
      data: req.body,
    });

    res.status(201).json({
      status: "success",
      data: {
        [modelName]: doc,
      },
    });
  });

export const updateOne = (model: any, modelName: string) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await model
      .update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          updatedAt: new Date(),
        },
      })
      .catch(() => null);

    if (!doc) {
      return next(new AppError(`There is no ${modelName} with that id!`, 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        [modelName]: doc,
      },
    });
  });

export const deleteOne = (model: any, modelName: string) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await model
      .delete({
        where: { id: req.params.id },
      })
      .catch(() => null);

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

export const uploadImageToFirebase = (fileDest: string, storage: any) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    const file = req.file;

    const safeName = fileDest.slice(0, -1).toLowerCase();

    const filename = `${fileDest}/${safeName}-${
      req.params[`${safeName}Id`] || ""
    }-${file.originalname}-${Date.now()}`;

    const fileRef = storage.file(filename);

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${
      process.env.FIREBASE_STORAGE_BUCKET
    }/o/${encodeURIComponent(filename)}?alt=media`;

    req.body.image = downloadURL;

    next();
  });
