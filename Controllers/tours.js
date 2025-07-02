const mongoose = require("mongoose");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");

const Tour = require("./../Models/tour");
const QueryHandler = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("./../utils/catchAsync");

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/tours');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `tour-${req.params.id}-${Date.now()}.${ext}`)
//     }
// })

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image'))
        cb(null, true)
    else
        cb(new AppError("Only images are allowed", 400), false)
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uplaodTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
]);

exports.processTourImages = catchAsync(async(req, res, next) => {
    console.log('REQ FILES: ', req.files);
    if (req.files) {
        // handling image cover
        const imageCoverName = `tour-cover-${req.params.id}-${Date.now()}.jpeg`
        await sharp(req.files.imageCover[0].buffer)
            .resize(300, 300)
            .toFormat("jpeg")
            .toFile(`uploads/tours/${imageCoverName}`)
        
        req.body.imageCover = imageCoverName;
    
        // handling iamges
        await Promise.all(
            req.files.images.map(async (file, idx) => {
                const imageName = `tour-${req.params.id}-${Date.now()}-${idx + 1}.jpeg`;
    
                await sharp(file.buffer)
                    .resize(2000, 1333)
                    .toFormat("jpeg")
                    .toFile(`uploads/tours/${imageName}`)
                
                req.body.images.push(imageName);
            })
        );
    } else if (!req.tour && !req.tour.isNew) {
        req.body.imageCover = 'default-image-cover.jpg';
    }

    next();
});

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

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
    const tour = await Tour.findById(req.params.id).populate("reviews");
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
    console.log("REQ BODY: ", req.body);
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
    const updatedTour = await Tour.findByIdAndDelete(req.params.id);

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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/213/center/-12.231,312.321/unit/km
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(",");

    // const radius = unit == "mi" ? distance / 3963.2 : distance / 6378.1; 
    const radius = distance;

    const tours = await Tour.find({ startLocation: {
        $geoWithin: {$centerSphere: [[lng, lat], radius]}
    }})

    console.log(distance , latlng, unit)

    res.status(200).json({
        status: "sucess",
        results: tours.length,
        data: {
            tours
        }
    })
})

// /nearest-tours/:lanlng/unit/:unit
exports.getNearestTours = catchAsync(async (req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(",");
    console.log(lat, lng);

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    const nearestTours = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [parseFloat9, parseFloat(lat)]
                },
                distanceField: 'distance',
                // distanceMultiplier: multiplier
            }   
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            nearestTours
        }
    })
})
