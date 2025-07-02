const Review = require("../Models/review");
const catchAsync = require("../utils/catchAsync");

exports.getAllReview = catchAsync(async (req, res, next) => {
    const reviews = await Review.find().populate([
        {
            path: "tour",
            select: "-__v"
        },
        {
            path: "user",
            select: "-__v"
        }
    ]);

    res.status(200).json({
        status: "success", 
        data: {
            reviews
        }
    })
})

exports.createReview = catchAsync(async (req, res, next) => {
    // {review : "fda", rating: 1, tour: "fdas341d", user: "fdsakj932d"}

    let {content, rating, tour, user} = req.body;
    if (!tour) tour = req.params.tourId;
    if (!user) user = req.user._id;

    const newReview = await Review.create({
        content, rating , tour, user
    })

    res.status(201).json({
        status: "success",
        data: {
            newReview
        }
    })
})

exports.getReview = catchAsync(async (req, res, next) => {
    // {review : "fda", rating: 1, tour: "fdas341d", user: "fdsakj932d"}

    const {content, rating, tour, user} = req.body;
    const newReview = await Review.create({
        content, rating , tour, user
    })

    res.status(201).json({
        status: "success",
        data: {
            newReview
        }
    })
})