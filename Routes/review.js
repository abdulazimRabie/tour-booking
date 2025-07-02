const express = require("express");
const reviewsController = require("../Controllers/reviews");
const authController = require("../Controllers/authController");
const router = express.Router();

router.route("/")
    .get(reviewsController.getAllReview)
    .post(authController.protect, authController.restrictedTo("user"), reviewsController.createReview)

module.exports = router;