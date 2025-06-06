const crypto = require("crypto")
const mongoose = require("mongoose");
const validator = require('validator');
const bcrypt = require("bcryptjs");

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "User must have a name"]
    },
    email: {
        type: String,
        required: [true, "User must have an email"],
        unique: [true, "This email is already registerd"],
        validate: [validator.isEmail, "Email format is wrong. Must be aa@bb.com"]
    },
    photo: {
        type: String,
        default: 'default-avatar.jpg'
    },
    password : {
        type: String,
        require: [true, "Password is required"],
        minlength: 8,
        select: false
    },
    confirmedPassword: {
        type: String,
        required: [true, "Confirmatinon password is required"],
        validate: {
            validator: function(val) {
                return this.password === val;
            },
            message: "The passwrod and its confirmation aren't identical"

        }
    },
    role: {
        type: String,
        enum: ["user", "admin", "guide", "lead-guide"],
        default: "user"
    },
    changedPasswordAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

// Document Middleware : Pre save middleware
UserSchema.pre("save", async function (next) {
    // THIS only works if the passwrod field is actually changed
    if (!this.isModified("password")) return next();

    // THIS encrypt the password with cost/salt 12
    this.password = await bcrypt.hash(this.password, 12);

    // IF we want to delete a field from the document, we set it to undedfined
    this.confirmedPassword = undefined

    next();
})

// Run this query before any query starts with `find`
UserSchema.pre(/^find/, function(next) {
    // this in the query middleare refers the query itself
    this.find({active: {$ne: false}});
    next();
})

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.changedPasswordAt) {
        const passChangedAt = +(this.changedPasswordAt.getTime() / 1000)
        console.log(passChangedAt, JWTTimestamp)
        
        return passChangedAt > JWTTimestamp
    }
    return false;
}

UserSchema.methods.createPasswordResetToken = function() {
    // create random string(bytes) with crypto node moduel
    const resetToken = crypto.randomBytes(32).toString("hex")
    // hash this random token & set hashed value to database
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")
    // set expired date for reset password token
    this.passwordResetTokenExpires = Date.now() + (10 * 60 * 1000) // add ten minutes to the current time

    console.log({
        hashedResetToken : this.passwordResetToken,
        resetToken
    })

    return resetToken;
}

const User = mongoose.model("User", UserSchema);

module.exports = User;