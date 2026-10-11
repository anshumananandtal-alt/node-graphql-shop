module.exports = `
    type orderProduct {
        _id: String!
        title: String!
        price: Float!
        description: String!
        imageUrl: String!
        userId: ID!
    }
    type orderItem {
        product: orderProduct!
        quantity: Int!

    }
    type orderUser{
        name: String!
        userId: ID!
    }
    type order {
        _id: ID!
        products: [orderItem!]!
        user: orderUser!
    }
    type ordersData {
        message: String!
        orders: [order!]!
    }
    type postOrderData {
        order: order!
        message: String!
    }
    extend type query {
        orders: ordersData!
    }
    extend type mutation {
       postOrder(sessionId: String!): postOrderData!
    }
`