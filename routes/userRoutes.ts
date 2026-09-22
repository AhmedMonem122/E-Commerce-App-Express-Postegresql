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
  uploadUserPhotoToFirebase,
  updateMe,
  deleteMe,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

/* =====================================================
   PUBLIC AUTH ROUTES
===================================================== */

router.post("/signup", register);

router.post("/signin", login);

router.post("/forgotPassword", forgotPassword);

router.put("/resetPassword/:token", resetPassword);

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
  uploadUserPhotoToFirebase,
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
