module.exports = `
    type ProductInCart {
        _id: String!
        title: String!
        description: String!
        price: Float!
        imageUrl: String!
    }
    type CartItem {
        productId: ProductInCart!
        quantity: Int!
    }
    type Cart{
        items: [CartItem!]!
    }
    type Checkout {
        items: [CartItem!]! 
        sessionId: String!
        url: String!
    }
    type AddDeleteCartData {
        message: String!
        status: Int!
    }
    extend type query {
        carts: Cart!
        checkout:  Checkout!
    }

    extend type mutation {
        deleteCart(productId: String! ): AddDeleteCartData!
        addToCart(productId: String!): AddDeleteCartData!
    }
`