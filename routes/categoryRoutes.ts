import express from "express";
import {
  getAllCategories,
  getSpecificCategory,
  addCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  uploadCategoryImageToSupabase,
} from "../controllers/categoryController";
import { protect, restrictTo } from "../controllers/authController";
import { filterByCategories } from "../controllers/productController";
import productRouter from "./productRoutes";

const router = express.Router({ mergeParams: true });

router.use("/:categoryId/products", filterByCategories, productRouter);

router
  .route("/")
  .get(getAllCategories)
  .post(
    protect,
    restrictTo("admin"),
    uploadCategoryImage,
    uploadCategoryImageToSupabase,
    addCategory,
  );

router
  .route("/:id")
  .get(getSpecificCategory)
  .patch(
    protect,
    restrictTo("admin"),
    uploadCategoryImage,
    uploadCategoryImageToSupabase,
    updateCategory,
  )
  .delete(protect, restrictTo("admin"), deleteCategory);

export default router;
