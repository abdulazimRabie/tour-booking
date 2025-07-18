const express = require("express");
const toursController = require("./../Controllers/tours");
const authController = require("../Controllers/auth");
const reviewRouter = require("../Routes/review");
const {validateTour , validateTourBody, topFiveTours} = require("./../Middlewares/tours");

const router = express.Router();

router.use("/:tourId/reviews", reviewRouter);

router.get("/top-5-tours", topFiveTours, toursController.getAllTours);

router.get("/tours-stats", toursController.toursStats);

router.route("/monthly-plan/:year").get(toursController.monthlyPlan);

router.param("id", validateTour);

router.route("/")
    // .get(authController.protect, toursController.getAllTours)
    .get(toursController.getAllTours)
    .post(
        validateTourBody,
        toursController.uplaodTourImages, 
        toursController.processTourImages, 
        toursController.createTour);

router.route("/:id")
    .get(toursController.getTour)
    .patch(
        toursController.uplaodTourImages,
        toursController.processTourImages,
        toursController.updateTour,
    )
    .delete(authController.protect, authController.restrictedTo("admin", "lead-guide"),toursController.deleteTour);

router.get("/tours-within/:distance/center/:latlng/unit/:unit", toursController.getToursWithin)
router.get("/nearest-tours/:latlng/unit/:unit", toursController.getNearestTours);


// POST api/v1/tours/3432fsdc32d/reviews (create new review on a specific tour)
// GET api/v1/tours/3324398d/reviews (get all tours of a specific tour)
// router.route("/:tourId/reviews")
//     .post(authController.protect, authController.restrictedTo("user"), reviewController.createReview)


// router.route("/:tourId/reviews/:reviewId")
//     .get(reviewController.getReview)

module.exports = router;