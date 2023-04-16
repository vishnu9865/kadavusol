//setup dotenv
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const { request } = require('express');
const cors = require('cors');

const app = express();
app.use( express.static( 'public'));
app.set( 'view engine', 'ejs');
app.use( bodyParser.urlencoded( { extended: true }));
app.use( cors({
    origin: '*'
}));

app.use(session({
  secret: process.env.MY_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin( passportLocalMongoose);
userSchema.plugin( findOrCreate);

const User = new mongoose.model( 'User', userSchema);

passport.use( User.createStrategy());

passport.serializeUser( User.serializeUser());
passport.deserializeUser( User.deserializeUser());

// main schema for password storage
const passSchema = new mongoose.Schema({
  title: String,
  website: String,
  password: String,
  user: String
});

const Password = new mongoose.model( 'Password', passSchema);

// register page
app.post('/register', ( req, res) => {
  User.register({ username: req.body.username }, req.body.password, (err) => {
    if( err) {
      console.log( err);
      res.redirect( '/register');
    } else {
      passport.authenticate( 'local')( req, res, () => {
        res.redirect( '/home');
      });
    }
  });
});

// login page
app.post( '/login', ( req, res) => {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login( user, ( err) => {
    if( err) {
      console.log( err);
    } else {
      passport.authenticate( 'local')( req, res, () => {
        console.log("redirecting to home");
        res.redirect( "/home");
      });
    }
  });

});

// login page
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
})

// register page
app.get('/register', (req, res) => {
  res.render('register', { title: 'register' });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if( err)
      console.log(err);
    res.redirect('/login');
  });
});

// create a password
app.post('/new-password', (req, res) => {
  if( req.isAuthenticated()) {
    const { title: title, website: website, password: password} = req.body;
    console.log(req.body);
    const pass = new Password({
      user: req.user.username,
      title: title,
      website: website,
      password: password
    });
    pass.save((err) => {
      if(!err) {
        res.redirect("/home");
      } else {
        console.log(err);
      }
    });
  } else {
    res.redirect( '/login');
  }
});

// delete a password
app.get("/delete/:passId", ( req, res) => {
  if( req.isAuthenticated())
  {
    Password.deleteOne({_id: req.params.passId}).exec();
    res.redirect('/home');
  }
  else
  {
    res.redirect('/login');
  }
});

// edit a password
app.get("/edit/:passId", ( req, res) => {
  if( req.isAuthenticated())
  {
    Password.findOne({_id: req.params.passId})
    .exec((err, result) =>{
      res.render('edit-password', {
        title: "Edit Password",
        user: req.user.username,
        password: result
      });
    });
  }
  else{
    res.redirect('/login');
  }
})

app.get('/new-password', ( req, res) => {
  if( req.isAuthenticated()) {
    res.render('new-password', { 
      title: 'Create Password',
      user: req.user
    });
  }
});

// home page
app.get('/home', ( req, res) => {
  if( req.isAuthenticated()) {
    let passwordTable = null;
    Password.find( { 'user': req.user.username}, ( err, result) => {
      if( err)
      {
        console.error(err);
      }
      else{
        passwordTable = result;
        res.render( 'home', {
          title: 'Home',
          user: req.user,
          passwordTable: passwordTable
        });
      }
    })
  } else {
    res.redirect( '/login' );
  }
});

// start the server
app.listen( process.env.PORT || 3000, () => {
  console.log('Server started on port 3000.');
});