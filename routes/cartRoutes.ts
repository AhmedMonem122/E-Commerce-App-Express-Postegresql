import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import {
  getLoggedUserCart,
  addProductToCart,
  clearUserCart,
  updateProductCartQuantity,
  removeSpecificCartItem,
} from "../controllers/cartController";

const router = express.Router();

router.use(protect, restrictTo("user"));

router
  .route("/")
  .get(getLoggedUserCart)
  .post(addProductToCart)
  .delete(clearUserCart);

router
  .route("/:productId")
  .put(updateProductCartQuantity)
  .delete(removeSpecificCartItem);

export default router;
