const fs = require("fs");
const mongoose = require("mongoose");
const Tour = require("./../../Models/tour");
const User = require("./../../Models/user");
const Review = require("./../../Models/review");
const dotenv = require("dotenv");

dotenv.config({path: "./../../config.env"});

// const DB = process.env.DATABASE.replace("<db_password>", process.env.DATABASE_PASSWORD);
const DB = process.env.DATABASE_LOCAL

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`));

mongoose.connect('mongodb://localhost:27017/tours', {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: true,
    // useUnifiedTopology: true
}).then(_ => {
    console.log("Database Connected Successfuly");
    importData();
    // deleteData();

})

const importData = async () => {
    try {
        await Tour.insertMany(tours);
        await User.insertMany(users);
        await Review.insertMany(reviews);
        
        console.log("Tours data imported Successfuly");
    } catch (error) {
        console.log("Cann't import all tours coming from tours");
        console.log(error.message);
    }
}

const deleteData = async () => {
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()

        console.log("All data deleted");
    } catch(error) {
        console.log("ERROR : Deleting");
        console.log(error.message);
    }
}