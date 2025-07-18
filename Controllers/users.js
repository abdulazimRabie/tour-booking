const User = require("../Models/user");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("../Services/factory");
const multer = require("multer");

// Utili Functions
const filterAllowedFields = (obj, allowedFields) => {
    const finalObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) finalObj[el] = obj[el]
    })
    return finalObj
}

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename : (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `user-${req.user._id}-${Date.now()}.${ext}`)
    }
})

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image"))
        cb(null, true)
    else
        cb(new AppError("Only upload image files to user's photo", 400), false)
}

const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadUserImages = upload.single('photo');

// update controller for users
exports.updateMe = catchAsync (async (req, res, next) => {
    // 1. check password not included in the changed fields
    if (req.body.password || req.body.confirmedPassword) {
        return next(new AppError("Cannot update password using this route. Use /updatePassword instead.", 400))
    }

    console.log(req.file)
    // 2. filter fields to be changed - ensure that you're gonna change the allowed properties
    const allowed = ["name", "email"];
    const filterdBody = filterAllowedFields(req.body, allowed);
    if (req.file) filterdBody.photo = req.file.filename;
    console.log(filterdBody)

    // 3. save and update new fields
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filterdBody, {
        new: true,
        runValidators: true
    })

    // 4. return success with new data
    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync (async (req, res, next) => {
    console.log(req.user);
    await User.findByIdAndUpdate(req.user._id, {active: false})
    res.status(204).json({
        status: "success",
        data: null
    })
})

exports.getAllUsers = async (req, res) => {
    const users = await User.find();
    res
    .status(200)
    .json({
        status : "success",
        data : {
            users
        }
    })
}

exports.createUser = (req, res) => {
    res
    .status(202)
    .json({
        status : "success",
        data : {
            done: true
        }
    })
}

// update controllers for admins
exports.updateUser = (req, res) => {
    res
    .status(202)
    .json({
        status : "success",
        data : {
            done: true
        }
    })
}

exports.deleteUser = (req, res) => {
    res
    .status(202)
    .json({
        status : "success",
        data : {
            done: true
        }
    })
}

exports.getUser = factory.findOne(User, {});