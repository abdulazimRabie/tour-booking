const Review = require("../Models/review");
const catchAsync = require("../utils/catchAsync");
const factory = require("../Services/factory");

exports.getAllReview = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = {tour: req.params.tourId};

    const reviews = await Review.find(filter).populate([
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

exports.getReview = factory.findOne(Review, {
    populate: [
        {path: "tour"},
        {path: "user"}
    ]
});

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review)