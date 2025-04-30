const AppError = require("../utils/appError");

const sendErrorDev = (error, res) => {
    res.status(error.statusCode).json({
        error,
        stack: error.stack,
        status: error.status,
        message: error.message,
    })
}

const sendErrorProd = (error, res) => {
    if (error.isOperational) {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message
        })
    } else {
        res.status(500).json({
            error,
            name: error.name,
            status: "fail",
            message: error.message,
            flag: "non operational"
        })
    }
}

const handleCastErrorDB = (error) => {
    const msg = `Invalid ID: ${error.value}, ${error.valueType} can't be casted to ObjectID`;
    return new AppError(msg, 400);
}

const handleValidationErrorDB = (error) => {
    console.log("VALIDATION ERROR");
    let errMsgs = Object.value(error.errors).map(e => e.message);
    console.log(errMsgs);
    return new AppError(errMsgs.join(" ||| ", 400));
}

const handelJsonWebTokenError = _ => new AppError('Not Authorized User', 401)

const handleExpiredToken = _ => new AppError("Token has been expired, please login again!", 401)

module.exports = (error, req, res, next) => {
    console.log("GLOBAL HANDLING ERROR IS WORKING");
    console.log(error.stack);
    error.status = error.status || "error";
    error.statusCode = error.statusCode || 500;

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(error, res);
    } else if (process.env.NODE_ENV === "production") {
        console.log(error);
        let err = {...error};
        if (err.name === "CastError") err = handleCastErrorDB(err);
        if (err.name === "ValidationError") err = handleValidationErrorDB(err);
        if (err.name === "JsonWebTokenError") err = handelJsonWebTokenError();
        if (err.name === "TokenExpiredError") err = handleExpiredToken()

        sendErrorProd(err, res);
    }

    next(error)
}