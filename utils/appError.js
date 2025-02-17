class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? "fail" : "error";
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor); // i don't know why, but we're gonna figure it out later
    }
}

module.exports = AppError;