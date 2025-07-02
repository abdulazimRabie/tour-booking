const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, "Review must have a review content"]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour : {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, "Review must belong to a tour"]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "Review must belong to a user"]
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true} // make sure that calulated fields also are shown in output
})

reviewSchema.pre(/^find/, function() {
    this.populate({
        path: 'user',
        select: "-__v"
    })
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;