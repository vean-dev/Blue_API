const express = require("express");
const userController = require("../controllers/user");

// const { verify, verifyAdmin, isLoggedIn } = require("../auth");
const { verify, verifyAdmin } = require("../Auth");
const router = express.Router();

//create user
router.post("/create-user", verify, verifyAdmin, userController.createUser);

// login users
router.post("/login", userController.loginUser);

//Get User Details
router.get("/profile", verify, userController.getProfile);

// Get all profile
router.get("/get-all-profile", verify, verifyAdmin, userController.getAllUsers);

//[SECTION] Get user profile by ID
router.get(
  "/get-profile/:userId",
  verify,
  verifyAdmin,
  userController.getUserProfileById
);

//[SECTION] update user Profile
router.put(
  "/update-profile/:userId",
  verify,
  verifyAdmin,
  userController.updateUserById
);

// [SECTION] Reset user password
router.put(
  "/reset-password",
  verify,
  verifyAdmin,
  userController.resetPassword
);

//[SECTION] Route for logging out of the application

module.exports = router;
