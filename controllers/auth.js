const User = require('../models/user');
const Crypto = require('crypto')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer');
const sendGridTransporter = require('nodemailer-sendgrid-transport')
const { validationResult } = require('express-validator')

const transporter = nodemailer.createTransport(sendGridTransporter({
    auth: {
        api_key: process.env.SEND_GRID_KEY
    }
}))

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
    errorMessage: req.flash('error')?.[0],
    oldInput: { email : "", password: ""},
    errorValidation : []
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: req.flash('error')?.[0],
    oldInput: { name: '', email : '', password: '', confirmPassword: ''},
    errorValidation: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  let userDoc 
  const errors = validationResult(req)
  const errorMessage = errors.array().find(err => err.path === 'email' || err.path === 'password')
  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false,
      errorMessage: errorMessage?.msg ?? '',
      oldInput: { email, password},
      errorValidation: errors.array()
    })
  }
  User.findOne({ email })
  .then(user =>{
    console.log(email, password, errors, errorMessage, user)
    if(user){
      userDoc= user
      console.log('#postlogin', email, password, user)
      return bcrypt.compare(password, user.password)
    }
    return false
  })
  .then(isMatch=>{
    if(isMatch){
      req.session.isLoggedIn = true;
      req.session.user = userDoc;
      return req.session.save(err => {
        console.log(err);
        return res.redirect('/');
      });
    }
    req.flash('error', 'Invalid Email/Password');
    return res.redirect('/login')
  })
  .catch(err =>{
    const error = new Error(err)
    error.httpStatusCode = 500
    // res.redirect('/error')
    next(error)
  });;
};

exports.postSignup = (req, res, next) => {
  const name = req.body.name
  const email = req.body.email
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  const errors = validationResult(req)
  console.log('#errors', errors.array())
  const emailOrPasswordRelatedError = errors.array().find(err => err.path === 'email' || err.path === 'password' || err.path === 'confirmPassword' || err.path === 'name')
  if(!errors.isEmpty()){
    return res.status(422)
      .render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false,
      errorMessage: emailOrPasswordRelatedError?.msg ?? '',
      oldInput: { email, password, name, confirmPassword},
      errorValidation: errors.array()
    })
  }
  bcrypt.hash(password, 12)  .then((passwordHash)=>{
    const newUser = new User({
      name,
      email,
      password: passwordHash,
      cart: {items: []}
    })
    return newUser.save()
  })
  .then((result)=>{
    res.redirect('/login')
    return transporter.sendMail({
      to: email,
      from: "anshuman.anand.tal@gmail.com",
      subject: 'Signup suceeded',
      html: "<h1> Signup was successful </h1>"
    })
  })
  .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getResetPassword = (req, res, next)=>{
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    isAuthenticated: false,
    errorMessage: req.flash('error')?.[0]
  })
}


exports.postResetPassword = (req, res, next)=>{
  const email = req.body.email
  Crypto.randomBytes(32, (err, buffer)=>{
    if(err){
      console.log(err)
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex')
    User.findOne({ email })
    .then(user =>{
      if(!user){
        req.flash('error', 'User with the provided email not found.')
      }
      user.resetToken = token
      user.resetTokenExpTime = new Date().getTime() + 3600000
      return user.save()
    })
    .then(result =>{
      return transporter.sendMail({
        to: req.body.email,
        from : 'anshuman.anand.tal@gmail.com',
        subject: 'Reset password',
        html: `
          <p> You requested a password reset </p>
          <p> Please Click the link<a href="http://localhost:3000/reset/${token}">Reset</a> to reset the password
        `
      })
    }).then(result=>{
      res.redirect('/')
    })
  })
}

exports.getNewPassword = (req, res, next)=>{
  const token = req.params.token
  console.log(token)
  User.findOne({
    resetToken: token,
    resetTokenExpTime: { $gt: new Date().getTime()}
  })
  .then(user=>{
    if(!user){
      return res.redirect('/404')
    }
    return res.render('auth/new-password', {
      path: '/reset',
      pageTitle: 'New password',
      isAuthenticated: false,
      errorMessage: req.flash('error')?.[0],
      userId: user?._id ?? ''
    })
  }).catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });
}

exports.postNewPassword =  async (req, res, next)=>{
  const { password, userId } = req.body
  const hashPassword = await bcrypt.hash(password,12)
  User.updateOne({ _id: userId, resetTokenExpTime: { $gt: new Date().getTime()}}, {"$set": { password: hashPassword}})
  .then(result=>{
    console.log("Password updated successfully!!")
    res.redirect('/')
  })
  .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });
}
