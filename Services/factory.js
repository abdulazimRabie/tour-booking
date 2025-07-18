const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const QueryHandler = require("../utils/apiFeatures");

exports.findMany = (Model) => catchAsync(async (req, res, next) => {
    // Execute a query
    const apiHandlerFeatures = new QueryHandler(Model, req.query)
    .filter()
    .sort()
    .fieldsLimt()
    .pagination();
    const docs = await apiHandlerFeatures.query;

    // console.log(docs);
    // Rturn reponse
    res
    .status(200)
    .send({
        status: "success",
        results: docs.length,
        requestedAt: req.requestTime,
        data : {
            tours: docs
        }
    });
});

exports.findOne = (Model, options) => catchAsync(async (req, res, next) => {
    let query =  Model.findById(req.params.id);
    if (options.filter) query.filter(options.filter);
    if (options.populate) query.populate(options.populate);

    const doc = await query;

    if (!doc) {
        return next(new AppError("Cann't find a doc with that ID", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            doc
        }
    }) 
});

exports.updateOne = (Model) => exports.updateTour = catchAsync(async (req, res, next) => {
    const updatedDoc = await Model.findByIdAndUpdate(
        {"_id": req.params.id}, 
        {$set : req.body}, 
        {new: true, runValidators: true});

    if (!updatedDoc) {
        return next(new AppError("Cann't find a doc with that ID", 404));
    }

    res.status(202).json({
        status: "success",
        data: {
            updatedDoc
        }
    })
});

exports.deleteOne = (Model) => catchAsync(async (req, res, next) => {
    const deletedDoc = await Model.findByIdAndDelete(req.params.id);

    if (!deletedDoc) {
        return next(new AppError("Cann't find a tour with that ID", 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    })
});