const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let passportLocalMongoose = require("passport-local-mongoose");


if (typeof passportLocalMongoose !== 'function' && passportLocalMongoose.default) {
  passportLocalMongoose = passportLocalMongoose.default;
}
// -----------------

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: "Listing"
  }]
});

// अब यहाँ सही function पास होगा
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);