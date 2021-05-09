const { number } = require("@hapi/joi");
const mongoose = require("mongoose");
//Accounts Data

const accountsSchema = new mongoose.Schema({
  BankName:{
      type: String,
      required: true,
      min: 6,
      max: 255,
  },
  BankAccountNumber: {
    type: String,
    required: true,
    min: 9,
    max: 18,
  },
  ISC:{
    type: String,
    required: true,
    min: 11,
    max: 11,
  },
  phone:{
      type: String,
      required: true,
      min: 12,
      max: 12
  }
});

accountsSchema.path('BankAccountNumber').validate(async (BankAccountNumber) => {
  const BankAccountNumberCount = await mongoose.models.Wallet.countDocuments({ BankAccountNumber })
  return !BankAccountNumberCount
}, 'Bank is already linked to wallet')

module.exports = mongoose.model("Accounts", accountsSchema);