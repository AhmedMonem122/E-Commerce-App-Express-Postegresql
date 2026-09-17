import express from "express";
import {
  createCheckoutSession,
  getUserPayments,
  getAllPayments,
  addPayment,
  getSpecificPayment,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

router.use(protect);

router.post("/checkout-session", createCheckoutSession);

router.get("/myPayments", getUserPayments);

router.use(restrictTo("ADMIN"));

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
    getAllPayments,
  )
  .post(addPayment);

router
  .route("/:id")
  .get(getSpecificPayment)
  .patch(updatePayment)
  .delete(deletePayment);

export default router;
