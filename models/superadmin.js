const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");

const SuperadminSchema = new Schema({
    username: {
        type: String,
        required: true,
    }
});

SuperadminSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("SuperAdmin", SuperadminSchema);




