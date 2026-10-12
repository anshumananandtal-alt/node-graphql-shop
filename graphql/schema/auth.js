module.exports = `
    type PostLoginData {
        token: String!
        userId: String!
        role: String!
    }
    type PostSignupData {
        token: String!
        userId: String!
        role: String!
    }
    
    type userData {
        _id: ID!
        email: String!
        name: String!
        role: String!
    }


    type PostLogoutData {
        message: String!
        status: Int!
    }

    extend type query {
        user(token: String!): userData!
    }
    
    extend type mutation {
        postLogin(email: String! password: String!): PostLoginData!
        postSignup(name: String! email: String! password: String! confirmPassword: String!): PostSignupData!
        postLogout(token: String!): PostLogoutData!
        postResetPassword(email: String!): PostLogoutData!
        postNewPassword(password:String! token:String!): PostLogoutData!
    }
`