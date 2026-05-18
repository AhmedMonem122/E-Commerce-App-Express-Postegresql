import express from "express";
import {
  getLoggedUserWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
} from "../controllers/wishlistController";
import { protect, restrictTo } from "../controllers/authController";

const router = express.Router();

router.use(protect, restrictTo("user"));

router.route("/").get(getLoggedUserWishlist).post(addProductToWishlist);

router.delete("/:productId", removeProductFromWishlist);

export default router;
