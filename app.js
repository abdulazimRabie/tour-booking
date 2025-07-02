const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSantize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const tourRouter = require("./Routes/tours");
const userRouter = require("./Routes/users");
const reviewRouter = require("./Routes/review");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./Controllers/errorController");

const app = express();

// MIDLLEWARES
// )> Set securtiy for HTTP headers
app.use(helmet());

// )> middleware to be able to edit request body (data comes from requests)
// )> body parser
app.use(express.json());

// )> mongo sanitize data
app.use(mongoSantize());

// )> xss
// app.use(xss())

// )> hpp : http prameters pollution
// prevent user from entring parameter more than one time. e.g: ?sort=name&sort=price
// since express will return an array of parameters [name, price]. And it's not wanted at all
app.use(hpp({
    whitelist: [
        "duration", 
        "ratingAverage", 
        "ratingQuantity", 
        "maxGroupSize", 
        "price",
        "summary",
        "description",
        "id",
        "durationInWeeks",
        "imageCover",
        "difficulty"
    ]
}));

// )> Limit requests of the same API
const limiter = rateLimit({
    windowMS: 60 * 60 * 1000, // one hour for the window
    limit: 3,
    message: "You've exceeded the maximum requests (100) in the last 1 hour. Wait a while and try again"
})
app.use("/api", limiter)

// )> Testing middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

app.use(morgan("dev"));
app.use(express.static(`${__dirname}/public`))

// ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.all("*", (req, res, next) => {
    const error = new AppError(`Cannot Handle THIS ROUTE : ${req.originalUrl}`, 404);
    next(error);
})

app.use(globalErrorHandler);

module.exports = app;