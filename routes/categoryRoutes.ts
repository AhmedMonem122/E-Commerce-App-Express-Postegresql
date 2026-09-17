import express from "express";
import {
  getAllCategories,
  getSpecificCategory,
  addCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  uploadCategoryImageToSupabase,
} from "../controllers/categoryController.js";
import { protect, restrictTo } from "../controllers/authController.js";
import { filterByCategories } from "../controllers/productController.js";
import productRouter from "./productRoutes.js";

const router = express.Router({ mergeParams: true });

router.use("/:categoryId/products", filterByCategories, productRouter);

router
  .route("/")
  .get(
    /*
      #swagger.parameters['page'] = {
        $ref: '#/components/parameters/pageParam'
      }
      #swagger.parameters['limit'] = {
        $ref: '#/components/parameters/limitParam'
      }
      #swagger.parameters['sort'] = {
        $ref: '#/components/parameters/sortParam'
      }
      #swagger.parameters['fields'] = {
        $ref: '#/components/parameters/fieldsParam'
      }
      #swagger.parameters['search'] = {
        $ref: '#/components/parameters/searchParam'
      }
    */
    getAllCategories,
  )
  .post(
    protect,
    restrictTo("ADMIN"),
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
    uploadCategoryImage,
    uploadCategoryImageToSupabase,
    addCategory,
  );

router
  .route("/:id")
  .get(getSpecificCategory)
  .patch(
    protect,
    restrictTo("ADMIN"),
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
    uploadCategoryImage,
    uploadCategoryImageToSupabase,
    updateCategory,
  )
  .delete(
    protect,
    restrictTo("ADMIN"),
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
    deleteCategory,
  );

export default router;
