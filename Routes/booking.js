const express = require("express");
const authController = require("../Controllers/auth");
const bookingController = require("../Controllers/booking");
const router = express.Router()

router.use(authController.protect);

// normal user must use this route to follow the payment process
router.get("/chekout-session/:tourID", bookingController.getCheckoutSession);
router.get("/my-tours", bookingController.getMyTours);

router.use(authController.restrictedTo("admin"))

router.route("/")
    .get(bookingController.getAllBookings)
    .post(bookingController.createNewBook);

router.get("/user/userID", bookingController.getUsersBookings);

router.route("/:id")
    .get(bookingController.getBooking)
    .delete(bookingController.deleteBookings)

module.exports = router;