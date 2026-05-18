import express from "express";
import {
  getAllBrands,
  getSpecificBrand,
  addBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  uploadBrandImageToSupabase,
} from "../controllers/brandController";
import { protect, restrictTo } from "../controllers/authController";
import { filterByBrands } from "../controllers/productController";
import productRouter from "./productRoutes";

const router = express.Router({ mergeParams: true });

router.use("/:brandId/products", filterByBrands, productRouter);

router
  .route("/")
  .get(getAllBrands)
  .post(
    protect,
    restrictTo("admin"),
    uploadBrandImage,
    uploadBrandImageToSupabase,
    addBrand,
  );

router
  .route("/:id")
  .get(getSpecificBrand)
  .patch(
    protect,
    restrictTo("admin"),
    uploadBrandImage,
    uploadBrandImageToSupabase,
    updateBrand,
  )
  .delete(protect, restrictTo("admin"), deleteBrand);

export default router;
