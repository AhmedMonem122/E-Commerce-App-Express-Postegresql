import express from "express";
import {
  createCheckoutSession,
  getUserPayments,
  getAllPayments,
  addPayment,
  getSpecificPayment,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController";
import { protect, restrictTo } from "../controllers/authController";

const router = express.Router();

router.use(protect);

router.post("/checkout-session", createCheckoutSession);

router.get("/myPayments", getUserPayments);

router.use(restrictTo("ADMIN"));

router.route("/").get(getAllPayments).post(addPayment);

router
  .route("/:id")
  .get(getSpecificPayment)
  .patch(updatePayment)
  .delete(deletePayment);

export default router;
