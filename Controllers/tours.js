const mongoose = require("mongoose");
const fs = require("fs");
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

const Tour = require("./../Models/tour");

const QueryHandler = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.getAllTours = catchAsync(async (req, res, next) => {
    // Execute a query
    const apiHandlerFeatures = new QueryHandler(Tour, req.query)
    .filter()
    .sort()
    .fieldsLimt()
    .pagination();
    const tours_db = await apiHandlerFeatures.query;

    // console.log(tours_db);
    // Rturn reponse
    res
    .status(200)
    .send({
        status: "success",
        results: tours_db.length,
        requestedAt: req.requestTime,
        data : {
            tours: tours_db
        }
    });

    // } catch (error) {
    //     res.status(400).json({
    //         status: "fail",
    //         message: error.message
    //     })
    // }

});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = new Tour({
        ...req.body
    })

    const savedTour = await newTour.save();
    
    res.status(201).json({
        status: "success",
        data : {
            tours: savedTour
        }
    })
});

exports.getTour = catchAsync(async (req, res, next) => {
    console.log("GET TOUR CONTROLLER IS WORKING BEFORE THE QUERY");
    const tour = await Tour.findById(req.params.id);
    console.log("AFTER THE QUERY")

    if (!tour) {
        return next(new AppError("Cann't find a tour with that ID", 404))
        // throw new AppError("There is not tour with that ID", 404);
    }

    res.status(200).json({
        status: "success",
        data: {
            tour
        }
    }) 
});

exports.updateTour = catchAsync(async (req, res, next) => {
    console.log("===CONTROLLER - UPDATING A TOUR===");
    const updatedTour = await Tour.findByIdAndUpdate(
        {"_id": req.params.id}, 
        {$set : req.body}, 
        {new: true, runValidators: true});

    if (!updatedTour) {
        return next(new AppError("Cann't find a tour with that ID", 404));
    }

    res.status(202).json({
        status: "success",
        data: {
            updatedTour
        }
    })

    // res.status(200).json({
    //     status: "success",
    //     data: {
    //         tour: {
    //             ...req.tour,
    //             ...updatedValues
    //         }
    //     }
    // })
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    await Tour.findByIdAndDelete(req.params.id);

    if (!updatedTour) {
        return next(new AppError("Cann't find a tour with that ID", 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    })
    // res.status(204).json({
    //     status: "success",
    //     message: null // means: don't return anything (NO CONTENT)
    // })
});

exports.toursStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {$match : {ratingAverage : {$gte: 4}}},
        {$group: {
            _id: {$toUpper : "$difficulty"},
            num: {$sum : 1},
            numOfRatings: {$sum : "$ratingQuantity"},
            avgRating: {$avg : "$ratingAverage"},
            avgPrice: {$avg : "$price"},
            minPrice: {$min : "$price"},
            maxPrice: {$max : "$price"},
            names: {$push: "$name"}
        }},
        {$sort : {avgPrice: 1}}
    ]);

    res.status(202).json({
        status: "success",
        results: stats.length,
        data : {
            stats
        }
    })
});

exports.monthlyPlan = catchAsync(async (req, res, next) => {
    const year = +req.params.year;
    console.log(year);

    const plan = await Tour.aggregate([
        {$unwind : "$startDates"},
        {
            $addFields: {
                startDateParsed: {
                    $dateFromString: {
                        dateString: { $arrayElemAt: [{ $split: ["$startDates", ","] }, 0] }
                    }
                }
            }
        },
        { 
            $match: { 
                startDateParsed: { 
                    $gte: new Date(`${year}-01-01`), 
                    $lte: new Date(`${year}-12-31`) 
                } 
            } 
        },
        {
            $group: {
                _id: {$month: "$startDateParsed"},
                count: {$sum: 1},
                tours: {$push: "$name"}
            }
        },
        {
            $addFields : {month: "$_id"}
        },
        {
            $sort : {count: -1, month: -1}
        },
        {$project : {_id: 0}}
    ]);

    res.status(202).json({
        status: "success",
        results: plan.length,
        data : {
            plan
        }
    });

});