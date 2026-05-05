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
} from "../controllers/userController";

const router = express.Router();

router.post("/signup", register);
router.post("/signin", login);

router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword/:token", resetPassword);

router.use(protect);

router.put("/updateMyPassword", updatePassword);
router.get("/me", getMe, getUser);
router.patch("/updateMe", uploadUserPhoto, uploadUserPhotoToFirebase, updateMe);
router.delete("/deleteMe", deleteMe);

router.use(restrictTo("ADMIN"));

router.route("/").get(getAllUsers).post(createUser);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
