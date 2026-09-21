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

    #swagger.requestBody = {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['title', 'description', 'image'],
          properties: {
            title: {
              type: 'string',
              example: 'Electronics'
            },

            description: {
              type: 'string',
              example: 'Electronic products and devices'
            },

            image: {
              type: 'string',
              format: 'binary'
            },

            brands: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: [
                'cmjBrand123',
                'cmjBrand456'
              ],
              description: 'Optional list of Brand IDs'
            },

            products: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: [
                'cmjProduct123',
                'cmjProduct456'
              ],
              description: 'Optional list of Product IDs'
            }
          }
          }
        }
      }
    }

  */
    uploadCategoryImage,
    uploadCategoryImageToSupabase,
    addCategory,
  );

router
  .route("/:id")
  .get(
    /*
  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    schema: {
      type: 'string'
    },
    description: 'Category ID',
    example: 'cmj123abc456'
  }
*/
    getSpecificCategory,
  )
  .patch(
    protect,
    restrictTo("ADMIN"),
    /*
  #swagger.security = [{
    bearerAuth: []
  }]

  #swagger.requestBody = {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              example: 'Electronics'
            },
            description: {
              type: 'string',
              example: 'Updated electronics category'
            },
            image: {
              type: 'string',
              format: 'binary'
            },
            brands: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['brandId1', 'brandId2']
            },
            products: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['productId1', 'productId2']
            }
          }
        }
      }
    }
  }
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

  #swagger.parameters['id'] = {
    in: 'path',
    required: true,
    schema: {
      type: 'string'
    },
    description: 'Category ID',
    example: 'cmj123abc456'
  }
*/
    deleteCategory,
  );

export default router;
