import type { Request, Response, NextFunction } from "express";

import { prisma } from "../prisma/client.js";

import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

// =====================================
// HELPERS
// =====================================

const calculateTotalCartPrice = async (cartId: string) => {
  const cartItems = await prisma.cartItem.findMany({
    where: {
      cartId,
    },
  });

  const totalCartPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  await prisma.cart.update({
    where: {
      id: cartId,
    },
    data: {
      totalCartPrice,
    },
  });

  return totalCartPrice;
};

// =====================================
// GET LOGGED USER CART
// =====================================

export const getLoggedUserCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(new AppError("Please login first", 401));
    }

    const cart = await prisma.cart.findFirst({
      where: {
        cartOwner: req.user.id,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return next(
        new AppError(
          "You don't have any products in your cart till now! You can add some.",
          404,
        ),
      );
    }

    res.status(200).json({
      status: "success",

      numOfCartItems: cart.items.length,

      cartId: cart.id,

      data: {
        cart,
      },
    });
  },
);

// =====================================
// ADD PRODUCT TO CART
// =====================================

export const addProductToCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(new AppError("Please login first", 401));
    }

    const { productId } = req.body;

    if (!productId) {
      return next(new AppError("Please provide productId", 400));
    }

    // check product exists
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return next(new AppError("No product found with that ID", 404));
    }

    // find cart
    const existingCart = await prisma.cart.findFirst({
      where: {
        cartOwner: req.user.id,
      },
    });

    let cartId: string;

    // create cart if not exists
    if (!existingCart) {
      const createdCart = await prisma.cart.create({
        data: {
          cartOwner: req.user.id,

          items: {
            create: [
              {
                count: 1,
                price: product.price,
                productId: product.id,
              },
            ],
          },
        },
      });

      cartId = createdCart.id;
    } else {
      cartId = existingCart.id;

      // check item exists
      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          cartId,
          productId,
        },
      });

      if (existingCartItem) {
        await prisma.cartItem.update({
          where: {
            id: existingCartItem.id,
          },

          data: {
            count: existingCartItem.count + 1,

            price: product.price * (existingCartItem.count + 1),
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId,

            productId,

            count: 1,

            price: product.price,
          },
        });
      }
    }

    // update total price
    await calculateTotalCartPrice(cartId);

    // get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cartId,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",

      numOfCartItems: updatedCart?.items.length || 0,

      cartId: updatedCart?.id,

      data: {
        cart: updatedCart,
      },
    });
  },
);

// =====================================
// UPDATE PRODUCT QUANTITY
// =====================================

export const updateProductCartQuantity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(new AppError("Please login first", 401));
    }

    const { count } = req.body;

    if (!count || Number(count) < 1) {
      return next(new AppError("Count must be greater than 0", 400));
    }

    const cart = await prisma.cart.findFirst({
      where: {
        cartOwner: req.user.id,
      },
    });

    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,

        productId: req.params.productId as string,
      },

      include: {
        product: true,
      },
    });

    if (!cartItem) {
      return next(new AppError("No cart item found", 404));
    }

    await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },

      data: {
        count: Number(count),

        price: cartItem.product.price * Number(count),
      },
    });

    await calculateTotalCartPrice(cart.id);

    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cart.id,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",

      numOfCartItems: updatedCart?.items.length || 0,

      cartId: updatedCart?.id,

      data: {
        cart: updatedCart,
      },
    });
  },
);

// =====================================
// REMOVE SPECIFIC CART ITEM
// =====================================

export const removeSpecificCartItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(new AppError("Please login first", 401));
    }

    const cart = await prisma.cart.findFirst({
      where: {
        cartOwner: req.user.id,
      },
    });

    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,

        productId: req.params.productId as string,
      },
    });

    if (!cartItem) {
      return next(new AppError("No cart item found", 404));
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    await calculateTotalCartPrice(cart.id);

    res.status(204).json({
      status: "success",

      data: null,
    });
  },
);

// =====================================
// CLEAR USER CART
// =====================================

export const clearUserCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(new AppError("Please login first", 401));
    }

    const cart = await prisma.cart.findFirst({
      where: {
        cartOwner: req.user.id,
      },
    });

    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    await prisma.cart.delete({
      where: {
        id: cart.id,
      },
    });

    res.status(204).json({
      status: "success",

      data: null,
    });
  },
);
