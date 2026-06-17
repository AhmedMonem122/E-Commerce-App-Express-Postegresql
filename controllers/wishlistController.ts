import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

// ==============================
// GET LOGGED USER WISHLIST
// ==============================
export const getLoggedUserWishlist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        createdBy: req?.user?.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!wishlist) {
      return next(
        new AppError(
          "You don't have any products in your wishlist till now! You can add some.",
          404,
        ),
      );
    }

    res.status(200).json({
      status: "success",
      count: wishlist.items.length,
      data: {
        products: wishlist.items.map((item) => item.product),
      },
    });
  },
);

// ==============================
// ADD PRODUCT TO WISHLIST
// ==============================
export const addProductToWishlist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = req.body.productId;

    let wishlist = await prisma.wishlist.findFirst({
      where: {
        createdBy: req?.user?.id,
      },
      include: {
        items: true,
      },
    });

    // Create wishlist if not exists
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          createdBy: req?.user?.id as string,
          items: {
            create: [
              {
                productId,
              },
            ],
          },
        },
        include: {
          items: true,
        },
      });
    } else {
      const existingProduct = wishlist.items.find(
        (item) => item.productId === productId,
      );

      if (existingProduct) {
        return next(
          new AppError(
            "You've already added this product to your wishlist!",
            400,
          ),
        );
      }

      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
      });

      wishlist = await prisma.wishlist.findUnique({
        where: {
          id: wishlist.id,
        },
        include: {
          items: true,
        },
      });
    }

    res.status(201).json({
      status: "success",
      message: "Successfully added your product to your wishlist 🎉",
      data: {
        products: wishlist?.items,
      },
    });
  },
);

// ==============================
// REMOVE PRODUCT FROM WISHLIST
// ==============================
export const removeProductFromWishlist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        createdBy: req?.user?.id,
      },
      include: {
        items: true,
      },
    });

    if (!wishlist) {
      return next(
        new AppError(
          "You don't have any products in your wishlist till now! You can add some.",
          404,
        ),
      );
    }

    const existingItem = wishlist.items.find(
      (item) => item.productId === req.params.productId,
    );

    if (!existingItem) {
      return next(
        new AppError(
          "You've already deleted this product from your wishlist!",
          404,
        ),
      );
    }

    await prisma.wishlistItem.delete({
      where: {
        id: existingItem.id,
      },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  },
);
