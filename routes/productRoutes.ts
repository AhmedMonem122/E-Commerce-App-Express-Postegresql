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
  uploadProductImagesToSupabase,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../controllers/authController.js";
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
    uploadProductImagesToSupabase,
    addProduct,
  );

router
  .route("/:id")
  .get(getSpecificProduct)
  .patch(
    protect,
    restrictTo("ADMIN"),
    uploadProductImages,
    uploadProductImagesToSupabase,
    updateProduct,
  )
  .delete(protect, restrictTo("ADMIN"), deleteProduct);

export default router;
