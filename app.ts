import express, { type NextFunction, Request, Response } from "express";
import morgan from "morgan";
import productRouter from "./routes/productRoutes";
import categoryRouter from "./routes/categoryRoutes";
import brandRouter from "./routes/brandRoutes";
import wishlistRouter from "./routes/wishlistRoutes";
import cartRouter from "./routes/cartRoutes";
import reviewRouter from "./routes/reviewRoutes";
import userRouter from "./routes/userRoutes";
import paymentRouter from "./routes/paymentRoutes";
import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";
import bodyParser from "body-parser";
import cors from "cors";
import { webhookCheckout } from "./controllers/paymentController";

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

app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/payment", paymentRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
