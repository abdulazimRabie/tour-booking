const express = require("express");
const morgan = require("morgan");
const tourRouter = require("./Routes/tours");
const userRouter = require("./Routes/users");

const app = express();


// MIDLLEWARES
// middleware to be able to edit request body (data comes from requests)
app.use(express.json());

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

app.use(morgan("dev"));
app.use(express.static(`${__dirname}/public`))
// ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;