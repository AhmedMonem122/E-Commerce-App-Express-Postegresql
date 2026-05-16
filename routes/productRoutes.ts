import express from "express";
import {
  getAllProducts,
  getSpecificProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  aliasTopProducts,
  getProductStats,
  uploadProductImages,
  uploadProductImagesToFirebase,
} from "../controllers/productController";
import { protect, restrictTo } from "../controllers/authController";
import reviewRouter from "./reviewRoutes.js";

const router = express.Router({ mergeParams: true });

router.use("/:productId/reviews", reviewRouter);

router.route("/top-5-cheap").get(aliasTopProducts, getAllProducts);

router.route("/product-stats").get(getProductStats);

router
  .route("/")
  .get(getAllProducts)
  .post(
    protect,
    restrictTo("ADMIN"),
    uploadProductImages,
    uploadProductImagesToFirebase,
    addProduct,
  );

router
  .route("/:id")
  .get(getSpecificProduct)
  .patch(
    protect,
    restrictTo("ADMIN"),
    uploadProductImages,
    uploadProductImagesToFirebase,
    updateProduct,
  )
  .delete(protect, restrictTo("ADMIN"), deleteProduct);

export default router;
