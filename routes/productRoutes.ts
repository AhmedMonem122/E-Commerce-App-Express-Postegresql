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
    getAllProducts,
  )
  .post(
    protect,
    restrictTo("ADMIN"),
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
    */
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
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
    */
    uploadProductImages,
    uploadProductImagesToSupabase,
    updateProduct,
  )
  .delete(
    protect,
    restrictTo("ADMIN"),
    /*
    #swagger.security = [{
      bearerAuth: []
    }]
    */
    deleteProduct,
  );

export default router;
