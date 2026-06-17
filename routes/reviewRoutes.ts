import express from "express";
import {
  getAllReviews,
  getReview,
  setProductUserIds,
  addReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { protect, restrictTo } from "../controllers/authController";

const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route("/")
  .get(getAllReviews)
  .post(protect, restrictTo("USER"), setProductUserIds, addReview);

router
  .route("/:id")
  .get(getReview)
  .patch(protect, restrictTo("user", "admin"), updateReview)
  .delete(protect, restrictTo("user", "admin"), deleteReview);

export default router;
