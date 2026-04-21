import express from "express";
import morgan from "morgan";
// const productRouter = require("./routes/productRoutes");
// const categoryRouter = require("./routes/categoryRoutes");
// const brandRouter = require("./routes/brandRoutes");
// const wishlistRouter = require("./routes/wishlistRoutes");
// const cartRouter = require("./routes/cartRoutes");
// const reviewRouter = require("./routes/reviewRoutes");
// const userRouter = require("./routes/userRoutes");
// const paymentRouter = require("./routes/paymentRoutes");
// const AppError = require("./utils/appError");
// const globalErrorHandler = require("./controllers/errorController");
import bodyParser from "body-parser";
import cors from "cors";
// const paymentController = require("./controllers/paymentController");

const app = express();

// app.post(
//   "/webhook-checkout",
//   express.raw({ type: "application/json" }),
//   paymentController.webhookCheckout
// );

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// app.use("/api/v1/products", productRouter);
// app.use("/api/v1/categories", categoryRouter);
// app.use("/api/v1/brands", brandRouter);
// app.use("/api/v1/wishlist", wishlistRouter);
// app.use("/api/v1/cart", cartRouter);
// app.use("/api/v1/reviews", reviewRouter);
// app.use("/api/v1/users", userRouter);
// app.use("/api/v1/payment", paymentRouter);

// app.all("*", (req, res, next) => {
//   next(new AppError(`Cant't find ${req.originalUrl} on this server!`, 404));
// });

// app.use(globalErrorHandler);

export default app;
