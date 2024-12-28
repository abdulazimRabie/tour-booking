const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./Models/tour");
const app = require("./app");

dotenv.config({path: "./config.env"});

const DB = process.env.DATABASE.replace("<db_password>", process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true
}).then(connectionObj => {
    // console.log(connectionObj.connection);
    console.log("database has connected successfuly")
})


// const toursTest = new Tour({
//     name: "Metropolitano",
//     price: 901
// })

// toursTest
//     .save()
//     .then(doc => {
//         console.log(doc);
//     })
//     .catch(error => {
//         console.log("Error : ", error);
//     })

// mongoose.model("Tour")
//     .find()
//     .then(tours => {
//         console.log(tours);
//     })

app.listen(3000, () => {
    console.log("server is running out there");
});