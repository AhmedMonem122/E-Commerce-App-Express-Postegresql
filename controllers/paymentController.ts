import type { Request, Response, NextFunction } from "express";
import Stripe from "stripe";

import { prisma } from "../prisma/client";

import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";

import { getAll, getOne, addOne, updateOne, deleteOne } from "./handlerFactory";

// ==============================
// STRIPE
// ==============================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia",
});

// ==============================
// VALIDATE URL
// ==============================
const validateUrl = (url: string) => {
  const urlPattern = /^(https?:\/\/)([\w.-]+)(:\d+)?(\/[^\s]*)?$/i;

  return urlPattern.test(url);
};

// ==============================
// CREATE CHECKOUT SESSION
// ==============================
export const createCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const cart = await prisma.cart.findFirst({
      where: {
        cartOwner: req?.user?.id,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return next(
        new AppError(
          "You don't have any products in your cart till now! Please add some to continue your purchase.",
          404,
        ),
      );
    }

    // validate frontend url
    if (
      !req.query.url ||
      typeof req.query.url !== "string" ||
      !validateUrl(req.query.url)
    ) {
      return next(
        new AppError(
          "Please provide a valid URL to continue your purchase.",
          400,
        ),
      );
    }

    // validate shipping address
    const shippingAddress = req.body.shippingAddress;

    if (
      !shippingAddress ||
      !shippingAddress.details ||
      !shippingAddress.phone ||
      !shippingAddress.city
    ) {
      return next(
        new AppError(
          "Please provide a shipping address to continue your purchase.",
          400,
        ),
      );
    }

    // stripe line items
    const line_items = cart.items.map((item) => ({
      price_data: {
        currency: "usd",

        product_data: {
          name: item.product.title,

          description: item.product.description,

          images: item.product.imageCover ? [item.product.imageCover] : [],
        },

        unit_amount: Math.round(item.product.price * 100),
      },

      quantity: item.count,
    }));

    // create stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      line_items,

      mode: "payment",

      success_url: `${req.query.url}/allOrders`,

      cancel_url: `${req.query.url}/`,

      customer_email: req?.user?.email,

      client_reference_id: cart.id,

      metadata: {
        shippingAddress: JSON.stringify(shippingAddress),
      },
    });

    res.status(200).json({
      status: "success",
      session,
    });
  },
);

// ==============================
// CREATE PAYMENT AFTER SUCCESS
// ==============================
const createPaymentCheckout = async (session: any) => {
  const cartId = session.client_reference_id;

  if (!cartId) return;

  const cart = await prisma.cart.findUnique({
    where: {
      id: cartId,
    },

    include: {
      items: true,
    },
  });

  if (!cart) return;

  const userId = cart.cartOwner;

  const price = cart.totalCartPrice;

  const amount = cart.items.reduce((acc, item) => acc + item.count, 0);

  const shippingAddress = JSON.parse(session.metadata?.shippingAddress || "{}");

  // create payment
  await prisma.payment.create({
    data: {
      userId,

      price,

      amount,

      paid: true,

      shippingDetails: shippingAddress.details,

      shippingPhone: shippingAddress.phone,

      shippingCity: shippingAddress.city,

      items: {
        create: cart.items.map((item) => ({
          count: item.count,

          price: item.price,

          productId: item.productId,
        })),
      },
    },
  });

  // delete cart
  await prisma.cart.delete({
    where: {
      id: cartId,
    },
  });
};

// ==============================
// STRIPE WEBHOOK
// ==============================
export const webhookCheckout = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    await createPaymentCheckout(event.data.object);
  }

  res.status(200).json({
    received: true,
  });
};

// ==============================
// GET USER PAYMENTS
// ==============================
export const getUserPayments = catchAsync(
  async (req: Request, res: Response) => {
    const payments = await prisma.payment.findMany({
      where: {
        userId: req?.user?.id,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",

      results: payments.length,

      data: {
        payments,
      },
    });
  },
);

// ==============================
// FACTORY CRUD
// ==============================
export const getAllPayments = getAll(prisma.payment, "payments");

export const getSpecificPayment = getOne(prisma.payment, "payment", {
  items: {
    include: {
      product: true,
    },
  },

  user: {
    select: {
      id: true,
      name: true,
      email: true,
      photo: true,
    },
  },
});

export const addPayment = addOne(prisma.payment, "payment");

export const updatePayment = updateOne(prisma.payment, "payment");

export const deletePayment = deleteOne(prisma.payment, "payment");
