const mongoose = require("mongoose");
const fs = require("fs");
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

const Tour = require("./../Models/tour");

const QueryHandler = require("../utils/apiFeatures");

exports.getAllTours = async (req, res) => {
    try {
        // Execute a query
        const apiHandlerFeatures = new QueryHandler(Tour, req.query).filter().sort().fieldsLimt().pagination();
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
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        })
    }

};

exports.createTour = (req, res) => {
    const newTour = new Tour({
        ...req.body
    })

    newTour.save()
    .then(savedTour => {
        res.status(201).json({
            status: "success",
            data : {
                tours: savedTour
            }
        })
    })
    .catch(error => {
        res.status(400).json({
            status: "failed",
            error: error.message
        })
    })
};

exports.getTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        res.status(200).json({
            status: "success",
            data: {
                tour
            }
        }) 

    } catch(error) {
        res.status(404).json({
            status: "fail",
            message: "Looking for this document has been failed"
        })
    }
};

// Helping function to handle updating tours
// TODO: this help function will be deleted after creating a middleware that checks if the tour is found or not
const updateTours = (id, updatedValues) => {
    let result = null;

    tours.map(tour => {
        if (tour.id === id) {
            tour = {
                ...tour,
                ...updatedValues
            }

            result = tour
        }
    })

    return result;
};

exports.updateTour = async (req, res) => {
    console.log("===CONTROLLER - UPDATING A TOUR===");
    try {
        const updatedTour = await Tour.findByIdAndUpdate(
            {"_id": req.params.id}, 
            {$set : req.body}, 
            {new: true, runValidators: true});

        res.status(202).json({
            status: "success",
            data: {
                updatedTour
            }
        })
    } catch(error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        })
    }

    // res.status(200).json({
    //     status: "success",
    //     data: {
    //         tour: {
    //             ...req.tour,
    //             ...updatedValues
    //         }
    //     }
    // })
};

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: "success",
            data: null
        })
    } catch(error) {
        res.status(400).json({
            status: "fail",
            message: error.message
        })
    }
    // res.status(204).json({
    //     status: "success",
    //     message: null // means: don't return anything (NO CONTENT)
    // })
};

exports.toursStats = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: "Cann't get tours statistics"
        })
    }
}

exports.monthlyPlan = async (req, res) => {
    try {
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

    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: "Cann't get tours monthly plan"
        })
    }
}