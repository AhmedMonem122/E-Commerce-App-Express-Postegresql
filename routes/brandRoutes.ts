import express from "express";
import {
  getAllBrands,
  getSpecificBrand,
  addBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  uploadBrandImageToSupabase,
} from "../controllers/brandController.js";
import { protect, restrictTo } from "../controllers/authController.js";
import { filterByBrands } from "../controllers/productController.js";
import productRouter from "./productRoutes.js";

const router = express.Router({ mergeParams: true });

router.use("/:brandId/products", filterByBrands, productRouter);

router
  .route("/")
  .get(getAllBrands)
  .post(
    protect,
    restrictTo("ADMIN"),
    uploadBrandImage,
    uploadBrandImageToSupabase,
    addBrand,
  );

router
  .route("/:id")
  .get(getSpecificBrand)
  .patch(
    protect,
    restrictTo("ADMIN"),
    uploadBrandImage,
    uploadBrandImageToSupabase,
    updateBrand,
  )
  .delete(protect, restrictTo("ADMIN"), deleteBrand);

export default router;
