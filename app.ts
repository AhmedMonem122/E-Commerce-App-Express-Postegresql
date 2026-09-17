import express, { type NextFunction, Request, Response } from "express";
import morgan from "morgan";
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
import bodyParser from "body-parser";
import cors from "cors";
import { webhookCheckout } from "./controllers/paymentController.js";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";

const app = express();

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout,
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// prettier-ignore
app.use("/api/v1/products", productRouter
    /*
    #swagger.tags = ['Products']
    */
);

// prettier-ignore
app.use(
  "/api/v1/categories",
  categoryRouter
  /*
    #swagger.tags = ['Categories']
  */
);

// prettier-ignore
app.use(
  "/api/v1/brands",
  brandRouter
  /*
    #swagger.tags = ['Brands']
  */
);

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

// prettier-ignore
app.use(
  "/api/v1/users",
  userRouter
  /*
    #swagger.tags = ['Users']
  */
);

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

const SWAGGER_CDN_VERSION = "4.15.5";
const CSS_URL = `https://cloudflare.com${SWAGGER_CDN_VERSION}/swagger-ui.min.css`;
const BUNDLE_URL = `https://cloudflare.com${SWAGGER_CDN_VERSION}/swagger-ui-bundle.min.js`;
const PRESET_URL = `https://cloudflare.com${SWAGGER_CDN_VERSION}/swagger-ui-standalone-preset.min.js`;

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

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
