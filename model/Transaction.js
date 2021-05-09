const { number } = require("@hapi/joi");
const mongoose = require("mongoose");
//transaction Data

const transactionSchema = new mongoose.Schema({
  BankAccountNumber: {
    type: String,
    required: true,
    min: 9,
    max: 18,
  },
  phone:{
      type: String,
      required: true,
      min: 12,
      max: 12
  },
  status:{
      type: String,
      required: true,
      min:6,
      max: 8
  },
  amount:{
      type: Number,
      required: true,
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);