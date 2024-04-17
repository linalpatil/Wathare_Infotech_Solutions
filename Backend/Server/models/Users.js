const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    ts: Date,
    machine_status: Number,
    vibration: Number
});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;