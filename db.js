const mongoose = require('mongoose');
require('dotenv').config();

// dbname: process.env.MONGO_DB_NAME creates databaseName as demoUser
mongoose.connect(process.env.MONGO_DB_URI, { dbname: process.env.MONGO_DB_NAME }).then(() => {
    console.log("Database Connected");
}).catch((err) => {
    console.log("Error while connecting to Database : " + err)
})