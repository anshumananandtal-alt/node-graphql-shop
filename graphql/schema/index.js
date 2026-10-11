const { buildSchema } = require('graphql');
const userSchema = require('./auth')
const productSchema = require('./product')
const cartSchema = require('./cart')
const orderSchema = require('./order')

const schema = buildSchema(`  
    type query {
        _empty: String
    }
    type mutation {
        _empty: String
    }
    ${userSchema}
    ${productSchema}
    ${cartSchema}
    ${orderSchema}
    schema {
        query: query
        mutation: mutation
    }
`);

module.exports = schema;