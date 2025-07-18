const express = require("express");
const usersController = require("./../Controllers/users");
const authController = require("../Controllers/auth");
const router = express.Router();

router.post("/signup", authController.signup)
router.post("/login", authController.login)

router.post("/forgotPassword", authController.forgotPassword)
router.patch("/resetPassword/:token", authController.resetPassword)

// Protect all routes after this middleware
router.use(authController.protect)

router.patch("/updateMe", usersController.uploadUserImages, usersController.updateMe)

router.patch("/updatePassword", authController.updatePassword)
router.delete("/deleteMe", usersController.deleteMe)

router.route("/")
    .get(usersController.getAllUsers)
    .post(usersController.createUser)

router.route("/:id")
    .get(usersController.getUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router;
