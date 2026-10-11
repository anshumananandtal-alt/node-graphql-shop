module.exports = function (req, res, next){
    if(!req.session.isLoggedIn){
            const error = new Error('Not Authorised')
            error.status = 401
            next(error)
    }
    next()
}