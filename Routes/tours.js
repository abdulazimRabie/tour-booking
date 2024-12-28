const express = require("express");
const toursController = require("./../Controllers/tours");
const {validateTour , validateTourBody, topFiveTours} = require("./../Middlewares/tours");

const router = express.Router();

router.get("/top-5-tours", topFiveTours, toursController.getAllTours);

router.get("/tours-stats", toursController.toursStats);

router.route("/monthly-plan/:year").get(toursController.monthlyPlan);

router.param("id", validateTour);

router.route("/")
    .get(toursController.getAllTours)
    .post(validateTourBody, toursController.createTour);

router.route("/:id")
    .get(toursController.getTour)
    .patch(toursController.updateTour)
    .delete(toursController.deleteTour);

module.exports = router;