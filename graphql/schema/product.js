module.exports = `
    type user{
        _id: ID!
        name: String!
        email: String!
    }
    type Product {
        _id: String!
        title: String!
        price: Float!
        description: String!
        imageUrl: String!
        userId: user!
    }
    
    input addEditProductInput {
        title: String!
        price: Float!
        description: String!
        imageUrl: String!
    }

    type addEditProductData  {
        message: String!
        product: Product!
    }

    type deleteProduct  {
        message: String!
        status: Int!
    }

    type getProductData {
        products: [Product!]!
        totalPages: Int!
    }

    extend type query {
        product(_id: String!): Product!
        products(page: Int!) : getProductData!
    }
    extend type mutation {
        addProduct(userInput: addEditProductInput ): addEditProductData!
        editProduct(prodId: String! userInput: addEditProductInput ): addEditProductData!
        deleteProduct(_id: String!) : deleteProduct!
    }
`