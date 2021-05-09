const path = require('path');
var cookieParser = require('cookie-parser')

const express = require('express');
const bodyParser = require('body-parser');
const expressHbs = require('express-handlebars');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

const authRoutes = require("./routes/app");

const apiRoutes = require("./routes/api");


const app = express();

app.engine('hbs', expressHbs());
app.set('view engine', 'hbs');
app.set('views', 'views');

mongoose.connect('mongodb+srv://dbUser:dbuser@cluster0.kw31m.mongodb.net/user?retryWrites=true&w=majority',
{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(()=>{
    console.log('connection was successful')
}).catch((err)=>{
    console.log(err)
})

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(bodyParser.json());

app.get('/', (req, res, next)=>{
    const token = req.cookies.auth
    try{
        const user = jwt.verify(token, 'walletSystem@1@34567');
        console.log(user)
        if(!user){
            return res.render('app', {pageTitle: 'Wallet', notLogin: true})
        }
        return res.redirect('/dashboard');
    }
    catch(error){
        console.log(error)
        res.render('app', {pageTitle: 'Wallet', notLogin: true})
    }
})

app.use(authRoutes);

app.use(apiRoutes)


app.listen(3000)