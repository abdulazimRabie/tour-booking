const express = require("express");
const usersController = require("./../Controllers/users");
const router = express.Router();

router.route("/")
    .get(usersController.getAllUsers)
    .post(usersController.createUser)

router.route("/:id")
    .get(usersController.getUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router;
