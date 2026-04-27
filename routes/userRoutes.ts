import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} from "../controllers/authController";
// import userController from "../controllers/userController";

const router = express.Router();

router.post("/signup", register);
router.post("/signin", login);

router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword/:token", resetPassword);

router.use(protect);

router.put("/updateMyPassword", updatePassword);
// router.get("/me", userController.getMe, userController.getUser);
// router.patch(
//   "/updateMe",
//   userController.uploadUserPhoto,
//   userController.uploadUserPhotoToFirebase,
//   userController.updateMe
// );
// router.delete("/deleteMe", userController.deleteMe);

router.use(restrictTo("admin"));

// router
//   .route("/")
//   .get(userController.getAllUsers)
//   .post(userController.createUser);

// router
//   .route("/:id")
//   .get(userController.getUser)
//   .patch(userController.updateUser)
//   .delete(userController.deleteUser);

export default router;
