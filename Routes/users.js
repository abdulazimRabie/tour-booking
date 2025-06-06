const express = require("express");
const usersController = require("./../Controllers/users");
const authController = require("../Controllers/authController");
const router = express.Router();

router.post("/signup", authController.signup)
router.post("/login", authController.login)

router.post("/forgotPassword", authController.forgotPassword)
router.patch("/resetPassword/:token", authController.resetPassword)

router.patch("/updateMe", authController.protect, usersController.uploadUserImages, usersController.updateMe)

router.patch("/updatePassword", authController.protect, authController.updatePassword)
router.delete("/deleteMe", authController.protect, usersController.deleteMe)

router.route("/")
    .get(usersController.getAllUsers)
    .post(usersController.createUser)

router.route("/:id")
    .get(usersController.getUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router;
