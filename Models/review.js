const mongoose = require("mongoose");
const Tour = require("../Models/tour");

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

// Preventing user from creating multiple reviews on the same tour
reviewSchema.index({tour: 1, user: 1}, {unique: true})

reviewSchema.pre(/^find/, function() {
    this.populate({
        path: 'user',
        select: "-__v"
    })
})

// Static method means you can access it from the Model
// e.g Review.calcRatingAvg
// You don't have to create an instance from the model or query on a document to have access on this method
reviewSchema.statics.calcRatingAvg = async function(tourID) {
    console.log("TourID : ", tourID);
    // this => query
    const stats = await this.aggregate([
        {$match : {tour: tourID}}, // identify specific tour to do statistics
        {$group: {
            _id: "$tour",
            nRating: {$sum: 1},
            avgRating: {$avg: "$rating"}
        }}
    ])

    // update tour fields
    // if the last review is deleted then, we won't get stats at all, it will be empty : []
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingAverage: stats[0].avgRating,
            ratingQuantity: stats[0].nRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingAverage: 0,
            ratingQuantity: 4.5 // default value as defined in Review Schema
        })
    }

    console.log(stats)
}

// calc average of rating after creating and saving the tour (document)
reviewSchema.post("save", function(next) {
    // this : document
    // this.constructor : points to the Model which is (Review)
    this.constructor.calcRatingAvg(this.tour);
    next();
})

// To calculate average after updating and deleting a review
// You'll need the document after each `findOneAnd`,since this runs when you call `findByIdAndUpdate / Delete`
// You cannot access the document after deleting , so you will need to grap it early
// So, You've to grap it before `findOneAnd`
// Store the document
// After `updating` / 'deleting' , you can calc the rating avg

reviewSchema.pre(/^findOneAnd/, async function(next) {
    // this: points to Query
    // we need to pass the document to the post middleware, since we'll not be able to get the document if it is deleted
    // attach the document to `this`
    // const review = await this.findOne()
    this.review = await this.findOne();
    console.log(this.review);
    next();
})

reviewSchema.post(/^findOneAnd/, async function() {
    // Run function that calculate the average
    // You can access the `updated` / `deleted` document from `this.review`
    await this.constructor.calcRatingAvg(this.review.tour); // here, it will run the pipeline to calc the rating avg
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;