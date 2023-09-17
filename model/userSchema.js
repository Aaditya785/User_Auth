const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    gender: {
        type: String,
    },
    age: {
        type: Number,
        default: 20,
    },
    refreshToken: {
        type: String
    },
    profilePic: {
        type: String
    }
})

module.exports = mongoose.model('User', userSchema);  // here it will create a collection in MongoDB name as 'users'.