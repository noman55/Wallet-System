const router = require("express").Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require("../model/User");
const Wallet = require("../model/Wallet");
const Accounts = require("../model/Accounts");
const Transaction = require("../model/Transaction");

const { loginValidation, accountValidationApi, debitValidationApi } = require("../validation");

const JWT_SECRET = 'walletSystem@1@34567'

var loggedIn = false // Global Variables to check whether user is logged in or not
var USER = undefined // store the user information once user has logged in
router.post('/login-api', async (req, res)=>{
  //validating the LogIn
  console.log(req.body)
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json({ error:   error.details[0].message });

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ error: "Email is wrong" });
  if (await bcrypt.compare(req.body.password, user.password)) {
    loggedIn = true
    const token = jwt.sign(
			{
				id: user._id,
				email: user.email
			},
			JWT_SECRET
		)
        res.json({
            accessToken: token,
            msg:"Logged successfully used this token to access your account"
        });
  }
  else{
  return res.status(400).json({ error: "Password is wrong" });
  }

})

var verifiedID = false

router.post('/create-wallet-api', async(req, res)=>{
  //verifying the mobile number enter by user to create a wallet
  const token = req.body.accessToken
  try{    
    const user = jwt.verify(token, JWT_SECRET);
    const wallet = new Wallet({
      email: user.email,
      phone: req.body.phoneNumber,
      amount: 0.0
    });
    try {
      const savedNumber = await wallet.save();
      verifiedID = true;
      res.status(200).json({msg: 'Successfully Created Your Wallet'});
    }
    catch (error) {
        res.send(error)
    }
  }
  catch(error){
      res.status(400).json({error: 'Invalid token or token is expired'})
  }
})

router.get('/check-balance-api', async(req, res)=>{
  //checking balance
  const token = req.body.accessToken
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    console.log(wallet)
    if(wallet){
       return res.status(200).json({msg: 'Available Balance In Wallet is ' + wallet['amount']})
    }
    else{
        return res.status(400).json({error: 'Please Create the Wallet First'})
    }
  }
  catch(error){
      res.status(400).json({error: 'Invalid Token'})
  }

})

router.post('/link-accounts-api', async(req, res)=>{
const token = req.body.accessToken
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if(wallet){
      const { error } = accountValidationApi(req.body);

      if (error) return res.status(400).json({ error:   error.details[0].message });

      const accounts = await Accounts.find({phone: wallet.phone})
      var bankAccountNumber = req.body.BankAccountNumber
      var bank = []
      for( var i=0;i<accounts.length;i++){
        bank.push(accounts[i].BankAccountNumber)
      }
      var bankNumber = bank.find((t)=>{
        return t==bankAccountNumber
      })
      if(bankNumber) return res.status(400).json({error: 'Bank Number is Already Linked'})

      const account = new Accounts({
        BankName: req.body.BankName,
        BankAccountNumber: req.body.BankAccountNumber,
        ISC: req.body.ISC,
        phone: wallet.phone
      });

      try {
        const savedAccount = await account.save();
        return res.status(200).json({msg: 'Successfully Linked Account to Wallet',savedAccount});
      } catch (error) {
        res.send(error)
      }
    }

  }
  catch(error){
      console.log(error)
      res.status(400).json({error: 'Invalid Token'})
  }

})

router.post('/add-money-api', async(req, res)=>{
  //adding money to wallet from bank account
  const token = req.body.accessToken
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if (wallet){
      const id = wallet['_id'];
      const accounts = await Accounts.find({phone: wallet.phone})
      if(!accounts) return res.status(400).json({error: 'Link the account first'})
      const oldAmount = Number(wallet['amount']);
      console.log(Number(oldAmount))
      var bank = []
      for(var i=0;i<accounts.length;i++){
        bank.push(
          accounts[i].BankAccountNumber,
        )
      }
      var bankAccountNumber = req.body.BankAccountNumber
      console.log(req.body.BankAccountNumber)
      var amount =req.body.Amount

      if(bankAccountNumber.length<9 && bankAccountNumber>18){
        return res.status(400).json({error: 'Enter A Valid Account Number'});
      }

      if(amount==""){
        return res.status(400).json({error: 'Amount cannot be empty'});
      }
      var a = Number(amount)

      var newAmount = await Number(oldAmount + a)
      console.log(newAmount)

      var bankNumber = bank.find((t)=>{
        return t==bankAccountNumber
      })

      if(bankNumber){
        const updateWallet = await Wallet.findByIdAndUpdate(id, {amount: newAmount},  async function (err, docs) {
          if (err){
              console.log(err)
          }
          else{
            const transaction = new Transaction({
              BankAccountNumber: bankNumber,
              phone: wallet.phone,
              status: 'credited',
              amount: a
            });
            try {
              const savedTransaction = await transaction.save();
              return res.status(200).json('successfully added money to wallet');
            } catch (error) {
              res.send(error)
            }
          }
         } 
        );
      }
      else{
        return res.status(400).json({error: 'Bank Number is Not Linked'});
      }
    }
    else{
        return res.status(400).json({error: 'Wallet is not created'});
    }
  }
  catch(error){
      res.status(400).json({error: 'Token is Invalid'})
  }
})

router.post('/debit-amount-api',async (req, res)=>{
  //handling debit amount page
  const token = req.body.accessToken
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if (wallet){
      const id = wallet['_id']
      const { error } = debitValidationApi(req.body);
      if (error) return res.status(400).json({ error:   error.details[0].message });
      var minAmount = 20
      var amountInWallet = Number(wallet['amount']);
      var transferAmount = Number(req.body.amount);
      var remainingAmount = amountInWallet - transferAmount
      if(remainingAmount <= minAmount){
        return res.status(400).json({error: 'Cannot perform transaction as minimum amount must be present in wallet'});
      }
      const updateWallet = await Wallet.findByIdAndUpdate(id, {amount: remainingAmount},  async function (err, docs) {
        if (err){
          return res.status(400).json({error: err});
        }
        else{
          const transaction = new Transaction({
            BankAccountNumber: req.body.BankAccountNumber,
            phone: wallet.phone,
            status: 'debited',
            amount: transferAmount
          });
          try {
            const savedTransaction = await transaction.save();
            return res.status(200).json({msg: 'Successfully debited amount from wallet'});
          } catch (error) {
            res.send(error)
          }
        }
       } 
      );
    }
  }
  catch(error){
      res.status(400).json({error: 'Invalid Token'})
  }

})

router.get('/get-transactions-api', async (req, res)=>{
  //getting the list of transactions
  const token = req.body.accessToken
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if(wallet){
      const transactions = await Transaction.find({phone: wallet.phone}).lean();
      console.log(transactions)
      res.status(200).json({transactions: transactions})
    }
  }
  catch(error){
      res.status(400).json({error: 'Invalid Token'})
  }
})

router.get('/get-linked-accounts-api', async (req, res)=>{
    //getting the list of transactions
    const token = req.body.accessToken
    try{
      const user = jwt.verify(token, JWT_SECRET)
      const email = user.email
      const wallet = await Wallet.findOne({ email: email});
      if(wallet){
        const accounts = await Accounts.find({phone: wallet.phone}).lean();
        res.status(200).json({Accounts: accounts})
      }
    }
    catch(error){
        res.status(400).json({error: 'Invalid Token'})
    }
  })

module.exports = router;