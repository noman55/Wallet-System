const Joi = require("@hapi/joi");
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required(),
  });
  return schema.validate(data);
};
const accountValidation = (data) =>{
    const schema = Joi.object({
        BankName: Joi.string().min(6).max(255).required(),
        BankAccountNumber: Joi.string().min(9).max(18).required(),
        ISC: Joi.string().min(11).max(11).required()
      });
      return schema.validate(data);
}

const accountValidationApi = (data) =>{
  const schema = Joi.object({
      BankName: Joi.string().min(6).max(255).required(),
      BankAccountNumber: Joi.string().min(9).max(18).required(),
      ISC: Joi.string().min(11).max(11).required(),
      accessToken: Joi.string().required()
    });
    return schema.validate(data);
}

const debitValidation = (data) =>{
    const schema = Joi.object({
        name: Joi.string().min(5).max(255).required(),
        BankAccountNumber: Joi.string().min(9).max(18).required(),
        ISC: Joi.string().min(11).max(11).required(),
        amount: Joi.string().required()
      });
      return schema.validate(data);
}
const debitValidationApi = (data) =>{
  const schema = Joi.object({
      name: Joi.string().min(5).max(255).required(),
      BankAccountNumber: Joi.string().min(9).max(18).required(),
      ISC: Joi.string().min(11).max(11).required(),
      amount: Joi.string().required(),
      accessToken: Joi.string().required()
    });
    return schema.validate(data);
}


module.exports = {
    loginValidation,
    accountValidation,
    debitValidation,
    debitValidationApi,
    accountValidationApi
};