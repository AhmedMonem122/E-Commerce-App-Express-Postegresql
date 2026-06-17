import type { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { APIFeatures } from "../utils/apiFeatures.js";
import { supabase } from "../config/supabase.js";

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

export const uploadImageToSupabase = (fileDest: string, bucket: string) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    const file = req.file;

    const safeName = fileDest.slice(0, -1).toLowerCase();

    const filename = `${fileDest}/${safeName}-${
      req.params[`${safeName}Id`] || ""
    }-${Date.now()}-${file.originalname}`;

    // upload to supabase storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      return next(error);
    }

    // get public url
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filename);

    req.body.image = publicUrl;

    next();
  });

export const uploadProductImagesToSupabaseFactory = (bucket: string) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as {
      imageCover?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };

    if (!files?.imageCover && !files?.images) {
      return next();
    }

    // ==============================
    // IMAGE COVER
    // ==============================
    if (files.imageCover?.length) {
      const cover = files.imageCover[0];

      const coverName = `Products/product-${
        req.params.id || ""
      }-cover-${Date.now()}-${cover.originalname}`;

      const { error: coverError } = await supabase.storage
        .from(bucket)
        .upload(coverName, cover.buffer, {
          contentType: cover.mimetype,
          upsert: false,
        });

      if (coverError) {
        return next(coverError);
      }

      const {
        data: { publicUrl: coverURL },
      } = supabase.storage.from(bucket).getPublicUrl(coverName);

      req.body.imageCover = coverURL;
    }

    // ==============================
    // PRODUCT IMAGES
    // ==============================
    if (files.images?.length) {
      const imagesURLs = await Promise.all(
        files.images.map(async (file, i) => {
          const imageName = `Products/product-${
            req.params.id || ""
          }-${Date.now()}-${i}-${file.originalname}`;

          const { error } = await supabase.storage
            .from(bucket)
            .upload(imageName, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (error) {
            throw error;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(imageName);

          return publicUrl;
        }),
      );

      req.body.images = imagesURLs;
    }

    next();
  });
