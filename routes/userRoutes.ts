import express from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} from "../controllers/authController.js";

import {
  getMe,
  getUser,
  uploadUserPhoto,
  uploadUserPhotoToSupabase,
  updateMe,
  deleteMe,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { validate } from "../utils/validate.js";
import {
  createUserSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  updateMeSchema,
  updatePasswordSchema,
  updateUserSchema,
} from "../validators/userValidator.js";

const router = express.Router();

/* =====================================================
   PUBLIC AUTH ROUTES
===================================================== */

router.post("/signup", validate(signupSchema), register);

router.post("/signin", validate(loginSchema), login);

router.post("/forgotPassword", validate(forgotPasswordSchema), forgotPassword);

router.put(
  "/resetPassword/:token",
  validate(resetPasswordSchema),
  resetPassword,
);

/* =====================================================
   PROTECTED ROUTES
===================================================== */

router.use(protect);

/* =========================
   CURRENT USER
========================= */

router.put(
  "/updateMyPassword",
  /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
  validate(updatePasswordSchema),
  updatePassword,
);

router.get(
  "/me",
  /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
  getMe,
  getUser,
);

router.patch(
  "/updateMe",
  /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
  uploadUserPhoto,
  uploadUserPhotoToSupabase,
  validate(updateMeSchema),
  updateMe,
);

router.delete(
  "/deleteMe",
  /*
    #swagger.security = [{
      bearerAuth: []
    }]
  */
  deleteMe,
);

/* =====================================================
   ADMIN ROUTES
===================================================== */

router.use(restrictTo("ADMIN"));

router
  .route("/")
  .get(
    /*
      #swagger.security = [{
        bearerAuth: []
      }]
    */
    getAllUsers,
  )
  .post(
    /*
      #swagger.security = [{
        bearerAuth: []
      }]
    */
    validate(createUserSchema),
    createUser,
  );

router
  .route("/:id")
  .get(
    /*
      #swagger.security = [{
        bearerAuth: []
      }]
    */
    getUser,
  )
  .patch(
    /*
      #swagger.security = [{
        bearerAuth: []
      }]
    */
    validate(updateUserSchema),
    updateUser,
  )
  .delete(
    /*
      #swagger.security = [{
        bearerAuth: []
      }]
    */
    deleteUser,
  );

export default router;
