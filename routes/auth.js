const express = require('express');
const authController = require('../controllers/auth');
const { loginValidation, signUpValidation} = require('../util/validations')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    loginValidation(),
    authController.postLogin);

router.post('/signup', 
    signUpValidation(),
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getResetPassword);

router.post('/reset', authController.postResetPassword)

router.get('/reset/:token', authController.getNewPassword)

router.post('/reset-password', authController.postNewPassword)


module.exports = router;