const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./Models/tour");
const app = require("./app");

dotenv.config({path: "./config.env"});
const DB = process.env.DATABASE_LOCAL.replace("<db_password>", process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    // useUnifiedTopology: true
}).then(connectionObj => {
    // console.log(connectionObj.connection);
    console.log("database has connected successfuly")
}).catch(erorr => console.log(erorr.message))

app.listen(3000, () => {
    console.log("server is running out there");
    console.log(process.env.NODE_ENV);
});