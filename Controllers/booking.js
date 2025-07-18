// const stripe = require("stripe")(process.env.STIPE_SECRETE_KEY);
let stripe;
const Tour = require("../Models/tour");
const Booking = require("../Models/booking");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("../Services/factory");

// createCheckoutBooking : normal payment flow
exports.getCheckoutSession = catchAsync (async (req, res, next) => {
    // 1) Get the tour wiil be booked
    const tour = Tour.findById(req.params.tourID);

    if (!tour) return next(new AppError("Invalid tour ID", 400));

    // 2) Craete checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        success_url: `${req.protocol}://${req.get("host")}/`,
        cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour._id}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [{
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: tour.images,
            price: tour.price * 1000,
            currency: 'usd',
            quantity: 1
        }]
    })

    // 3) Create session as a response
    res.status(200).json({
        status: "success",
        session
    })
})

// createBooking : available for admin, no need to follow the payment process
exports.createNewBook = catchAsync (async (req, res, next) => {
    const {tour, user, price} = req.body;
    if (!tour || !user || !price) 
        return next(new AppError("Booking must belongs to user and tour associated with the price", 400))

    const newBooking = await Book.create({tour, user, price, paid: false});

    res.status(201).json({
        status: "success",
        booking: newBooking
    })
})

exports.getAllBookings = factory.findMany(Booking);

exports.getBooking = factory.findOne(Booking, )

// getMyTours : returns booked tours of a user
exports.getMyTours = catchAsync (async (req, res, next) => {
    // 1) Get booking of the user
    const bookings = await Booking.find({user: req.user.id})
    
    // 2) Get tours id from the bookings
    const toursIDs = bookings.map(b => b.tour);
    
    // 3) Get these booked tours
    const bookedTours = await Tour.find({_id: {$in : toursIDs}})

    res.status(200).json({
        status: "success",
        bookedTours
    })
})

// get user's bookings : only available for admins
exports.getUsersBookings = catchAsync (async (req, res, next) => {
    if(!req.params.userID) return next(new AppError("Please pass the user ID to access his booked tours", 400))
    const bookings = await Booking.find({user: req.params.userID})

    res.status(200).json({
        status: "success",
        bookings
    })
})

// cancelBooking : delete booking
exports.deleteBookings = catchAsync (async (req, res, next) => {
    if(!req.params.id) return next(new AppError("Please pass the booking ID to delete it", 400))
    await Booking.findByIdAndDelete(req.params.id);

    res.status(204).json({})
})