const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "A booking must happend through a user"]
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
        required: [true, "Where is the booked tour."]
    },
    date: {
        type: Date,
        default: Date.now()
    },
    price: {
        type: Number,
        required: [true, "Please pass the amount of the booking"],
        min: 0
    },
    quantity: {
        type: Number,
        default: 1,
        min: [1, "Quantity cannot be less than 1"]
    },
    paid: {
        type: Boolean,
        default: true
    }
})

bookingSchema.pre(/^find/, function(next) {
    this.populate([
        {path: "user"},
        {path: "tour", select: "name"}
    ])
    next();
})

module.exports = mongoose.model("Booking", bookingSchema)