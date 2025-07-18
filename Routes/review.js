const express = require("express");
const reviewsController = require("../Controllers/reviews");
const authController = require("../Controllers/auth");
const router = express.Router({mergeParams: true});

router.route("/")
    .get(reviewsController.getAllReview)
    .post(authController.protect, authController.restrictedTo("user", "admin", "guide"), reviewsController.createReview)

router.route("/:id")
    .get(authController.protect, reviewsController.getReview)
    .patch(authController.protect, authController.restrictedTo("admin"), reviewsController.updateReview)
    .delete(authController.protect, authController.restrictedTo("admin"), reviewsController.deleteReview)

module.exports = router;