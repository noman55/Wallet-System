const { number } = require("@hapi/joi");
const mongoose = require("mongoose");
//wallet data

const walletSchema = new mongoose.Schema({
  email:{
      type: String,
      required: true,
      min: 6,
      max: 255,
  },
  phone: {
    type: String,
    required: true,
    min: 12,
    max: 12,
  },
  amount: {
      type: Number,
      required: true,
  }
});

walletSchema.path('phone').validate(async (phone) => {
  const phoneCount = await mongoose.models.Wallet.countDocuments({ phone })
  return !phoneCount
}, 'Phone Number Already Exists')

walletSchema.path('email').validate(async (email) => {
  const phoneCount = await mongoose.models.Wallet.countDocuments({ email })
  return !phoneCount
}, 'Account with Email Already Exists');

module.exports = mongoose.model("Wallet", walletSchema);