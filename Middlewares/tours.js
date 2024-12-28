const mongoose = require("mongoose");
const fs = require("fs");
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.topFiveTours = (req, res, next) => {
    req.query = {
        ...req.query,
        sort: "-maxGroupSize,-price",
        limit: "5"
    }
    console.log("Middleware to alias top 5 tours");
    next();
}

exports.validateTour = async (req, res, next, id) => {
    // const tour_id = +id;
    // const tour = tours.find(t => t.id == tour_id);
    console.log("====PARAM MIDDLEWARE====");
    
    try {
        const tour = await mongoose.model("Tour").findById(id);
        req.tour = tour;
        // if (tour.priceDiscount > tour.price) throw Error("Price Discount cann't be greater than price itself");
        console.log("Tour id :", id);
        console.log("Tour is found :", tour);

    } catch(error) {
        return res.status(400).json({
            status: "fail",
            message: error.message
        })
    }

    // if (!tour) {

    //     return res.status(404)
    //     .json({
    //         status: "fail",
    //         message: "This tour not found"
    //     })
    // }

    // req.tour = tour;
    
    next();
}

exports.validateTourBody = (req, res, next) => {
    console.log(`This route belongs to ${req.method}. so we will validate the input data`);
    // console.log(req.body)
    if (!req.body.hasOwnProperty("price") || !req.body.hasOwnProperty("name")) {
        return res.status(400).json({
            status: "fail",
            message: "The tour sent doesn't contain price or name"
        })
    }

    next();
}