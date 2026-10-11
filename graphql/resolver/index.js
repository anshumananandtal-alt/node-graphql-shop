const authResolver = require('./auth')
const productResolver = require('./product')
const cartResolver = require('./cart')
const orderResolver = require('./order')


module.exports = {
    ...authResolver,
    ...productResolver,
    ...cartResolver,
    ...orderResolver
};