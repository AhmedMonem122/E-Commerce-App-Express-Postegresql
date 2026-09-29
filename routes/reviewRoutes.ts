import express from "express";
import {
  getAllReviews,
  getReview,
  setProductUserIds,
  addReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect, restrictTo } from "../controllers/authController.js";
import { validate } from "../utils/validate.js";
import {
  createReviewSchema,
  updateReviewSchema,
} from "../validators/reviewValidator.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

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
    getAllReviews,
  )
  .post(
    protect,
    restrictTo("USER"),
    setProductUserIds,
    validate(createReviewSchema),
    addReview,
  );

router
  .route("/:id")
  .get(getReview)
  .patch(
    protect,
    restrictTo("USER", "ADMIN"),
    validate(updateReviewSchema),
    updateReview,
  )
  .delete(protect, restrictTo("USER", "ADMIN"), deleteReview);

export default router;
