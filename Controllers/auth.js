const crypto = require("crypto");
const {promisify} = require('util');
const User = require("../Models/user");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/mail").default;

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.TOKEN_EXP});
}

function createSendCookie(token, res) {
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.TOKEN_COOKIE_EXP * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions)
}

exports.signup = catchAsync(async (req, res, next) => {
    // THIS LINE OF CODE IS A BIG MISTAKE. DON'T STORE ALL DATA USER ENTERS. PREVENT HIME FROM BEING AN ADMIN, FOR EXAMPLE
    // const newUser = await User.create({...req.body});
    // const session = await mongoose.startSession();
    // session.startTransaction();
    // try {
        console.log("we're gonna signup new user");
        console.log(req.body);
        // 1. create a user
        // const newUser = await User.create([{
        //     name: req.body.name,
        //     email: req.body.email,
        //     password: req.body.password,
        //     confirmedPassword: req.body.confirmedPassword,
        //     // changedPasswordAt: req.body.changedPasswordAt,
        //     // role: req.body.role
        // }], {session});

        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            confirmedPassword: req.body.confirmedPassword
        })

        console.log("NEW USER WITH TRANSACTION : \n", newUser);
    
        // 2. set a token to him
        // const token = signToken({id: newUser[0]._id});
        const token = signToken({id: newUser._id});
        createSendCookie(token, res);

        // session.commitTransaction();
        // session.endSession();

        // newUser[0].password = undefined;
        newUser.password = undefined;
        
        res.status(201).json({
            status: "success",
            token,
            data: {
                // user: newUser[0]
                user: newUser
            }
        });
    // } catch (error) {
    //     next(error);
    // }
})

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    // 1. No email , No password
    if (!email || !password) {
        return next(new AppError("Email and Password are required", 400));
    }

    // 2. check the user
    const user = await User.findOne({email}).select("+password");
    // const passwordCheck = await bcrypt.compare(password, user.password)
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError("Email or Password is wrong", 400));
    }

    console.log(user)

    const token = signToken({id: user._id});
    user.password = undefined;
    // 3. everything is ok, send our regards
    createSendCookie(token, res);
    res.status(200).json({
        status: "success",
        token,
        data : {
            user
        }
    })
});

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // 1) get token from user
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    };
    
    // 2) ensure that user has a token
    if (!token) {
        return next(new AppError("You're not logged in. Please Log in first.", 401));
    }
    console.log(token);

    // 3) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded)

    // 4) check if user is still exist
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('User isn\'t exist anymore!, Sign in again', 401))
    }

    // 5) check if user has changed his password or not
    // Since if user changes his password, it won't be ellligable to accesss protected routes
    const hasPasswordChanged = freshUser.changedPasswordAfter(decoded.iat);
    if (hasPasswordChanged) {
        return next(new AppError("User has recently changed his password, so please login again", 401))
    }

    req.user = freshUser;
    next();
});

exports.restrictedTo = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role;
        if(!roles.includes(userRole)) {
            return next(new AppError("User isn't elligable to manipulate this data", 403))
        }
        next();
    }
}

exports.forgotPassword = catchAsync (async (req, res, next) => {
    // 1) user exists ?
    const user = await User.findOne({ email: req.body.email})
    if (!user) {
        return next(new AppError("No user with the provided email!", 404))
    }

    // 2) create resetToken with expired date
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    // 3) send it to user's email
    const resetURL = `${req.protocol}://${req.host}/api/v1/users/resetPassword/${resetToken}`
    const message = `
        Forgot Paasword? Hit the following URL as PATCH method.\n
        The URL will NOT be valid after 10 minutes.\n
        ${resetURL}\n
        Ignore this email if you didn't want to reset password
    `

    try {
        await sendEmail({
            email: req.body.email,
            subject: "[Natours.io] : Reset Password",
            message
        })

        res.status(200).json({
            status: "success",
            message: "Reset token hsa been updated. Email has been sent successfully."
        })
    } catch (error) {
        this.passwordResetToken = undefined;
        this.passwordResetTokenExpires= undefined;
        await user.save({ validateBeforeSave: false })

        return next(new AppError("Error while sending email. Please try again!", 500))
    }
})

exports.resetPassword = catchAsync (async (req, res, next) => {
    // 1. get user based on token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    console.log("RESET PASSWORD - HASHED TOKEN : ", hashedToken);

    const user = await User.findOne({
        passwordResetToken : hashedToken, 
        passwordResetTokenExpires: {$gt: Date.now()}
    })

    console.log("RESETING PASSWORD OF : ", user)
    
    // 2. verify token is valid and not expired
    if (!user) {
        return next(new AppError("Invalid or expired token", 400))
    }

    // 3. change password field to the new password and run the validation before save
    user.password = req.body.password;
    user.confirmedPassword = req.body.confirmedPassword;
    user.changedPasswordAt = Date.now() - 1000; // to ensure that changedPasswordAt is less than the iat of token

    // 4. remove passwordResetToken and it expired data by setting it to undefined
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    console.log("NEW PASSWORD AFTER RESETTING : ", user.password);

    // 5. log user in & send JWT
    // const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: process.env.TOKEN_EXP})
    const token = signToken({id: user._id})
    createSendCookie(token, res);
    res.status(200).json({
        status: "success",
        token
    })
})

exports.updatePassword = catchAsync (async (req, res, next) => {
    // 1. user must be authorized to take this action, so this must be protected
    // 2. req.user contains data of current user
    // 3. verify old password is correct
    const user = await User.findById(req.user._id).select("+password");
    const passwordCheck = await bcrypt.compare(req.body.oldPassword, user.password)
    if (!passwordCheck) {
        return next(new AppError("Current password isn't right", 400))
    }
    
    // 4. update new fields of password & confirmed password
    // 5. update passwordChangedAt field
    user.password = req.body.newPassword;
    user.confirmedPassword = req.body.confirmedPassword;
    user.changedPasswordAt = Date.now() - 1000;

    // 6. run validatation before saving
    await user.save();
    
    // 7. log in user by sending new jwt
    const token = signToken({id: req.user.id});
    createSendCookie(token, res);
    res.status(200).json({
        status: "success",
        token,
        data: {
            user
        }
    })
})