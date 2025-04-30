const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const tourRouter = require("./Routes/tours");
const userRouter = require("./Routes/users");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./Controllers/errorController");

const app = express();


// MIDLLEWARES
// middleware to be able to edit request body (data comes from requests)
app.use(express.json());

const limiter = rateLimit({
    windowMS: 60 * 60 * 1000, // one hour for the window
    limit: 3,
    message: "You've exceeded the maximum requests (100) in the last 1 hour. Wait a while and try again"
})
app.use("/api", limiter)

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

app.use(morgan("dev"));
app.use(express.static(`${__dirname}/public`))

// ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.all("*", (req, res, next) => {
    const error = new AppError(`Cannot Handle THIS ROUTE : ${req.originalUrl}`, 404);
    next(error);
})

app.use(globalErrorHandler);

module.exports = app;