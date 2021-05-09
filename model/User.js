const mongoose = require("mongoose");
//users data

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  email: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 1024,
  }
});

userSchema.path('email').validate(async (email) => {
  const emailCount = await mongoose.models.User.countDocuments({ email })
  return !emailCount
}, 'Email already exists')

module.exports = mongoose.model("User", userSchema);