module.exports = `
    type ProductInFav {
        _id: ID!
        title: String!
        description: String!
        price: String!
        imageUrl: String!
    }

    type ItemInFav {
        _id: ID!
        productId: ProductInFav!
    }

    
    type Favourite {
        items: [ItemInFav!]!
    }
    type DeleteFromFav {
        status: Int!
        message: String!
    }

    type AddToFav {
        status: Int!
        message: String!
        productId: ID!
    }
    
    extend type query {
        favourites: Favourite!
    }
    extend type mutation {
        deleteFavourite(prodId: String!): DeleteFromFav!
        addToFavourite(prodId: String !): AddToFav!
    }        

`