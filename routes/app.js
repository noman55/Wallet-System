const router = require("express").Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require("../model/User");
const Wallet = require("../model/Wallet");
const Accounts = require("../model/Accounts");
const Transaction = require("../model/Transaction");

const { loginValidation, accountValidation, debitValidation } = require("../validation");

const JWT_SECRET = 'walletSystem@1@34567'

router.get('/login', (req, res)=>{
  const token = req.cookies.auth
  try{
    const user = jwt.verify(token, JWT_SECRET);
    console.log(user)
    if(!user) res.render('login', {pageTitle: 'Login'})
    return res.redirect('/dashboard');
  }
  catch(error){
    console.log(error)
    res.render('login', {pageTitle: 'Login'})
  }
})

var loggedIn = false // Global Variables to check whether user is logged in or not
var USER = undefined // store the user information once user has logged in
router.post('/login', async(req, res)=>{
  //validating the LogIn
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).json({ error:   error.details[0].message });

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ error: "Email is wrong" });
  const pass = user['password']
  USER = user
  if (await bcrypt.compare(req.body.password, user.password)) {
    loggedIn = true
    const token = jwt.sign(
			{
				id: user._id,
				email: user.email
			},
			JWT_SECRET
		)
    res.cookie('auth',token);
    res.redirect('/dashboard');
  }

  else{
  return res.status(400).json({ error: "Password is wrong" });
  }

})

router.get("/register", (req, res)=>{
    //rendering the registration form
    res.render('register', {pageTitle:'Registration'})
})

router.post("/register", async (req, res) => {
  //handling the registration form
 const name = req.body.name
 const email = req.body.email
 const plainPassword = req.body.password
 if(name==''){
    return res.render('register', {pageTitle:'Registration', errorN: true, msg: 'Name Must Present'})
 }
 if(email==''){
  return res.render('register', {pageTitle:'Registration', errorE: true, msg: 'Email Must Present'})
 }
 if(plainPassword==''){
  return res.render('register', {pageTitle:'Registration', errorP: true, msg: 'Password Must Present'})
 }
 const password = await bcrypt.hash(plainPassword, 10)
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: password,
  });
  try {
    const savedUser = await user.save();
    res.redirect('/');
  } catch (error) {
    console.log(error['errors']['email']['path'])
    if(error['errors']['email']['path']=='email'){
      return res.render('register', {error: true, msg:'Email is already present', pageTitle: 'Registration'})
    }
    return res.render('register', {pageTitle: 'Registration', errorG: true, msg: 'Some error occurred while adding details'})

  }
});

router.get('/dashboard', async(req, res)=>{
  //showing dashboard once user is logged in
  const token = req.cookies.auth;
  try{
  const user = jwt.verify(token, JWT_SECRET)
  const email = user.email
  const wallet = await Wallet.findOne({ email: email});
  const minValue = 20;
  console.log('I am Here')
  console.log(wallet)
  if(wallet){
    const lessThanMinValue = wallet.amount< minValue
    console.log(lessThanMinValue)
    return res.render('welcome', {pageTitle: 'Welcome To Your Wallet', login: true, verify: true, wallet: wallet, number: wallet.phone, lessThanMinValue: lessThanMinValue, userEmail: email})
  }
  notVerified = !verifiedID
  return res.render('welcome', {pageTitle: 'Wallet System', login: true, notVerified: true, userEmail: email})
}
catch(error){
  return res.redirect('/login')
}
})
var verifiedID = false
router.post('/verify-number', async(req, res)=>{
  //verifying the mobile number enter by user to create a wallet
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const wallet = new Wallet({
      email: user.email,
      phone: req.body.phoneNumber,
      amount: 0.0
    });

    try {
      const savedNumber = await wallet.save();
      verifiedID = true;
      res.redirect('/dashboard');
    }
    catch (error) {
        res.send(error)
    }

  /*
  const from = "Wallet System"
  const to = req.body.phoneNumber
  const text = 'Your OTP for creating wallet is '+ val
  vonage.verify.request({
    number: req.body.phoneNumber,
    brand: "Wallet System"
  }, (err, result) => {
    if (err) {
      console.error(err);
    } else {
      const verifyRequestId = result.request_id;
      requestId = verifyRequestId
      console.log('request_id', verifyRequestId);
      res.render('Verify', {pageTitle: 'varify otp'})
    }
  });
  */
  }
  catch(error){
    res.redirect('/login')
  }
})

router.get('/check-balance', async(req, res)=>{
  //checking balance
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    const minValue = 20;
    console.log(wallet)
    if(wallet){
      const lessThanMinValue = wallet.amount< minValue
       return res.render('welcome', {pageTitle: 'Welcome To Your Wallet', login: true, verify: true, wallet: wallet, number: wallet.phone, amount: wallet.amount, lessThanMinValue: lessThanMinValue, checkBalance: true, userEmail: email})
    }
  }
  catch(error){
    res.redirect('/login');
  }
})

router.get('/add-money', async(req, res)=>{
  const token = req.cookies.auth;
  try{
      const user = jwt.verify(token, JWT_SECRET)
      const email = user.email
      const wallet = await Wallet.findOne({ email: email});
      if(wallet){
        const accounts = await Accounts.find({phone: wallet.phone})
        var bank = []
        for( var i=0;i<accounts.length;i++){
          bank.push({
            BankAccountNumber: accounts[i].BankAccountNumber,
            BankName: accounts[i].BankName
          }
          )
        }
        console.log(bank)
        console.log(accounts.length)
        if(accounts.length>0){
          res.render('addMoney', {pageTitle: 'Add Money', Accounts: true, bank: bank})
        }
        else{
          res.redirect('/link-accounts')
        }
      } 
  }
  catch(error){
    res.redirect('/login')
  }
})

router.get('/link-accounts', async(req, res)=>{
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if(wallet){
    res.render('linkAccounts', {pageTitle: 'Link Account'})
    }
  }
  catch(error){
    res.redirect('/login')
  }
})

router.post('/link-accounts', async(req, res)=>{
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if(wallet){
      const { error } = accountValidation(req.body);

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
      console.log(bankNumber, req.body.BankAccountNumber)
      if(bankNumber) return res.status(400).json({error: 'Bank Number is Already Linked'})

      const account = new Accounts({
        BankName: req.body.BankName,
        BankAccountNumber: String(req.body.BankAccountNumber),
        ISC: req.body.ISC,
        phone: wallet.phone
      });
      try {
        const savedAccount = await account.save();
        console.log('here')
        return res.redirect('/dashboard');
      } catch (error) {
        res.send(error)
      }
    }
  }
  catch(error){
    console.log(error)
    res.redirect('/login')
  }

})

router.post('/add-add-money', async(req, res)=>{
  //adding money to wallet from bank account
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if (wallet){
      const id = wallet['_id'];
      const accounts = await Accounts.find({phone: wallet.phone})
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
              return res.redirect('/check-balance');
            } catch (error) {
              res.send(error)
            }
          }
         } 
        );
      }
      else{
        return res.status(400).json({error: 'Bank Number is not linked'});
      }
    }
}
catch(error){
  res.redirect('/login')
}
})

router.get('/debit-amount', async(req, res)=>{
  //rendering debit-amount page
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if (wallet){
      res.render('debit-amount', {pageTitle: 'Transfer Amount'});
    }
}
catch(error){
  res.redirect('/login')
}
})

router.post('/debit-amount',async (req, res)=>{
  //handling debit amount page
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if (wallet){
      const id = wallet['_id']
      const { error } = debitValidation(req.body);
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
            return res.redirect('/check-balance');
          } catch (error) {
            res.send(error)
          }
        }
       } 
      );
    }
  }
  catch(error){
    res.redirect('/login');
  }
})

router.get('/transactions', async (req, res)=>{
  //getting the list of transactions
  const token = req.cookies.auth;
  try{
    const user = jwt.verify(token, JWT_SECRET)
    const email = user.email
    const wallet = await Wallet.findOne({ email: email});
    if(wallet){
      const transactions = await Transaction.find({phone: wallet.phone});
      console.log(transactions)
      var trans = [];
      for(var i=0;i<transactions.length;i++){
        trans.push({
          BankAccountNumber: transactions[i].BankAccountNumber,
          status: transactions[i].status,
          amount: transactions[i].amount
        })
      }
      res.render('transactions', {pageTitle: 'Transactions', transactions: trans})
    }
  }
  catch(error){
    res.redirect('/login')
  }
})

router.get('/logout', (req, res)=>{
  loggedIn = false
  res.cookie('auth', '');
  res.redirect('/')
})
module.exports = router;