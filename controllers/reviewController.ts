import type { Request, Response, NextFunction } from "express";

import { prisma } from "../prisma/client";

import { getAll, getOne, updateOne } from "./handlerFactory";

import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";

import { calcAverageRatings } from "../services/reviewService";

// ==============================
// SET PRODUCT + USER IDS
// ==============================
export const setProductUserIds = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.productId) {
    req.body.productId = req.params.productId;
  }

  if (!req.body.userId) {
    req.body.userId = req?.user?.id;
  }

  next();
};

// ==============================
// ADD REVIEW
// ==============================
export const addReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = String(req.params.productId);
    const userId = String(req.user?.id);

    // Check existing review
    const currentUserReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    let review;

    // User already fully reviewed
    if (
      currentUserReview &&
      currentUserReview.review &&
      currentUserReview.rating !== null &&
      currentUserReview.reactions
    ) {
      return next(
        new AppError("You've already left a review for this product!", 400),
      );
    }

    // Update partial review
    if (
      currentUserReview &&
      currentUserReview.review &&
      (currentUserReview.rating === null || !currentUserReview.reactions)
    ) {
      review = await prisma.review.update({
        where: {
          id: currentUserReview.id,
        },
        data: {
          rating: req.body.rating ? Number(req.body.rating) : null,
          reactions: req.body.reactions,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          review: req.body.review,
          rating: req.body.rating ? Number(req.body.rating) : null,
          reactions: req.body.reactions,
          productId,
          userId,
        },
      });
    }

    // Recalculate ratings
    await calcAverageRatings(productId);

    res.status(201).json({
      status: "success",
      data: {
        review,
      },
    });
  },
);

// ==============================
// GET REVIEWS
// ==============================
export const getAllReviews = getAll(prisma.review, "reviews");

export const getReview = getOne(prisma.review, "review", {
  user: {
    select: {
      name: true,
      photo: true,
    },
  },
  product: true,
});

// ==============================
// CHECK OWNERSHIP
// ==============================
export const checkReviewOwnership = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await prisma.review.findUnique({
      where: {
        id: req.params.id as string,
      },
    });

    if (!review) {
      return next(new AppError("No review found with that ID", 404));
    }

    if (review.userId !== req?.user?.id) {
      return next(new AppError("You can only modify your own reviews", 403));
    }

    next();
  },
);

// ==============================
// UPDATE REVIEW
// ==============================
export const updateReview = [
  checkReviewOwnership,

  updateOne(prisma.review, "review"),
];

// ==============================
// DELETE REVIEW
// ==============================
export const deleteReview = [
  checkReviewOwnership,

  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const review = await prisma.review.findUnique({
      where: {
        id: req.params.id as string,
      },
    });

    if (!review) {
      return next(new AppError("No review found with that ID", 404));
    }

    await prisma.review.delete({
      where: {
        id: req.params.id as string,
      },
    });

    // recalc ratings after delete
    await calcAverageRatings(review.productId);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }),
];
