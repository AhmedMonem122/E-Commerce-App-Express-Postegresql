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
    getAllBrands,
  )
  .post(
    protect,
    restrictTo("ADMIN"),
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
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
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
    uploadBrandImage,
    uploadBrandImageToSupabase,
    updateBrand,
  )
  .delete(
    protect,
    restrictTo("ADMIN"),
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
    deleteBrand,
  );

export default router;
