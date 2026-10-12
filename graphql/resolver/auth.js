const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const  validator  = require('validator');
const nodemailer = require('nodemailer')
const sendGridTransporter = require('nodemailer-sendgrid-transport');
const Crypto = require('crypto');

const transporter = nodemailer.createTransport(sendGridTransporter({
    auth: {
        api_key: process.env.SEND_GRID_KEY
    }
}))
 

module.exports = {
    user : async ({ token}, req) =>{
        const user = await User.findOne({ resetToken: token})
        if(!user){
            const err = new Error('Invalid token')
            err.code = 404
            throw err
        }
        return {
            ...user._doc
        }
    },
    postLogin : async ({ email, password }, req) => {
        let userDoc
        const errors = []
        if(!validator.isEmail(email) || !email){
            errors.push({ message: 'Please enter a valid email address.' })
        }
        if(!password || !validator.isLength(password, { min : 5})){
            errors.push({ message: 'Please enter a valid password with at least 5 characters.' })
        }
        if(errors.length > 0){
            const error = new Error('Invalid input.')
            error.code = 422
            error.data = errors
            throw error
        }
        const user = await User.findOne({ email })
        if(user){
            userDoc = user
            const isMatch = await bcrypt.compare(password, user.password)  
            if(isMatch){
                req.session.isLoggedIn = true;
                req.session.user = userDoc;
                await req.session.save()
                return {
                    token: req.session.id,
                    userId: userDoc._id.toString(),
                    role: user.role
                }
            }else{
                const error = new Error('Invalid email or password')
                error.code = 401
                throw error
            } 
        }else{
            const error = new Error('Invalid email or password')
            error.code = 401
            throw error
        }    
    },
    postSignup: async ({ name, email, password, confirmPassword }, req) => {
        const errors = []   
        if(!name || name.trim().length === 0){
            errors.push({ message: 'Name is required.' })
        }
        if(!validator.isEmail(email) || !email){
            errors.push({ message: 'Please enter a valid email address.' })
        }
        if(!password || password.length < 5){
            errors.push({ message: 'Please enter a valid password with at least 5 characters.' })
        }
        if(password !== confirmPassword){
            errors.push({ message: 'Passwords do not match.' })
        }
        if(errors.length > 0){
            const error = new Error('Invalid input.')
            error.code = 422
            error.data = errors
            throw error
        }   
        const existingUser = await User.findOne({ email })
        if(existingUser){
            const error = new Error('Email address already exists.')
            error.code = 422
            throw error
        }
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User({
            name,   
            email,
            password: hashedPassword,
            cart: { items: [] } 
        })
        const result = await user.save()
        req.session.isLoggedIn = true;
        req.session.user = result;
        await req.session.save()
        transporter.sendMail({
            to: email,
            from : 'anshuman.anand.tal@gmail.com',
            subject: 'Signup successful',
            html: '<h1>Signup successfully</h1>'
        })
        return {
            token: req.session.id,
            userId: result._id.toString(),
            role: result.role,
            message: 'User created successfully.'
        }
    },
    postLogout: async({ token }, req)=>{
        if(!token){
            const error= new Error('No active session')
            error.code = 401
            throw error
        }
        req.session.destroy((err)=>{
            if(err){
                const error = new Error('Something went wrong')
                error.code = 500
                throw error
            }
        })
        return {
            message: 'Logout successfully',
            status: 200
        }
    },
    postResetPassword: async ({ email }, req)=>{
        if(!validator.isEmail(email) || !email){
            const err = new Error('Invalid email')
            err.code = 422
            throw err
        }
        const user = await User.findOne({ email: email})
        if(!user){
            const err = new Error('User not found')
            err.code = 404
            throw err  
        }
        const token = await Crypto.randomBytes(32).toString('hex')
        user.resetToken = token
        user.resetTokenExpTime = await new Date().getTime() + 3600000
        await user.save() 
        try{
            const info = await transporter.sendMail({
                to: user.email,
                from: "anshuman.anand.tal@gmail.com",
                subject: 'Reset password',
                html: `<h1> Please click on <a href="http://localhost:5173/new-password/${token}"> link</a> to reset password`
            })
            return {
                message: 'Reset Password Link is sent to email',
                status: 200
            }
        }catch(err){
            err.code = 500
            throw err
        }

    },
    postNewPassword:  async ({ token, password}, req)=>{
        if(!token){
            const error = new Error('Token is required')
            error.code = 422
            throw error
        }
        if(validator.isEmpty(password) || !validator.isLength(password, { min: 5})){
            const error = new Error('Invalid Password')
            error.code = 422
            throw error 
        }
        const user = await User.findOne({resetToken : token})
        const currTime = await new Date().getTime()
        if(!user || currTime> user.resetTokenExpTime){
            const error = new Error('Invalid token provided')
            error.code = 422
            throw error
        }
        const hashPassword = await bcrypt.hash(password, 12)
        user.password = hashPassword
        const result = await user.save()
        return {
            message: 'Password reset successfully',
            status: 200
        }
    }
    
};