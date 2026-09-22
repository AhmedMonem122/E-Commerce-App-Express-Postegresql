import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import morgan from "morgan";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import hpp from "hpp";
import compression from "compression";
import cors from "cors";

import productRouter from "./routes/productRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import brandRouter from "./routes/brandRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import userRouter from "./routes/userRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";

import { webhookCheckout } from "./controllers/paymentController.js";

import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";

const app = express();

// ======================================================
// 1. SECURITY HTTP HEADERS
// ======================================================

app.use(helmet());

// ======================================================
// 2. CORS
// ======================================================

app.use(cors());

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     // credentials: true,
//   }),
// );

// ======================================================
// 3. RATE LIMITING
// ======================================================

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 100,

  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// ======================================================
// 4. STRIPE WEBHOOK
// MUST COME BEFORE express.json()
// ======================================================

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout,
);

// ======================================================
// 5. BODY PARSING
// ======================================================

app.use(
  express.json({
    limit: "10kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  }),
);

// ======================================================
// 6. HTTP PARAMETER POLLUTION
// ======================================================

app.use(
  hpp({
    whitelist: ["ratingsQuantity", "ratingsAverage", "price"],
  }),
);

// ======================================================
// 7. RESPONSE COMPRESSION
// ======================================================

app.use(compression());

// ======================================================
// 8. DEVELOPMENT LOGGING
// ======================================================

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ======================================================
// 9. ROUTES
// ======================================================

// Products
// prettier-ignore
app.use(
  "/api/v1/products",
  productRouter
  /*
    #swagger.tags = ['Products']
  */
);

// Categories
// prettier-ignore
app.use(
  "/api/v1/categories",
  categoryRouter
  /*
    #swagger.tags = ['Categories']
  */
);

// Brands
// prettier-ignore
app.use(
  "/api/v1/brands",
  brandRouter
  /*
    #swagger.tags = ['Brands']
  */
);

// Wishlist
// prettier-ignore
app.use(
  "/api/v1/wishlist",
  wishlistRouter
  /*
    #swagger.tags = ['Wishlist']
    #swagger.security = [{
      bearerAuth: []
    }]
  */
);

// Cart
// prettier-ignore
app.use(
  "/api/v1/cart",
  cartRouter
  /*
    #swagger.tags = ['Cart']
    #swagger.security = [{
      bearerAuth: []
    }]
  */
);

// Reviews
// prettier-ignore
app.use(
  "/api/v1/reviews",
  reviewRouter
  /*
    #swagger.tags = ['Reviews']
    #swagger.security = [{
      bearerAuth: []
    }]
  */
);

// Users
// prettier-ignore
app.use(
  "/api/v1/users",
  userRouter
  /*
    #swagger.tags = ['Users']
  */
);

// Payment
// prettier-ignore
app.use(
  "/api/v1/payment",
  paymentRouter
  /*
    #swagger.tags = ['Payment']
    #swagger.security = [{
      bearerAuth: []
    }]
  */
);

// ======================================================
// 10. SWAGGER
// ======================================================

const SWAGGER_CDN_VERSION = "4.15.5";

const CSS_URL = `https://unpkg.com/swagger-ui-dist@${SWAGGER_CDN_VERSION}/swagger-ui.css`;

const BUNDLE_URL = `https://unpkg.com/swagger-ui-dist@${SWAGGER_CDN_VERSION}/swagger-ui-bundle.js`;

const PRESET_URL = `https://unpkg.com/swagger-ui-dist@${SWAGGER_CDN_VERSION}/swagger-ui-standalone-preset.js`;

app.use(
  "/api-docs",
  swaggerUi.serve,
  (req: Request, res: Response, next: NextFunction) => {
    const swaggerSpecPath = path.join(process.cwd(), "swagger-output.json");

    if (fs.existsSync(swaggerSpecPath)) {
      const swaggerSpec = JSON.parse(fs.readFileSync(swaggerSpecPath, "utf8"));

      swaggerUi.setup(swaggerSpec, {
        customCssUrl: CSS_URL,
        customJs: [BUNDLE_URL, PRESET_URL],
      })(req, res, next);
    } else {
      res
        .status(404)
        .send("Swagger file is generating, please refresh in a moment.");
    }
  },
);

// ======================================================
// 11. UNKNOWN ROUTE
// ======================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ======================================================
// 12. GLOBAL ERROR HANDLER
// ======================================================

app.use(globalErrorHandler);

export default app;
