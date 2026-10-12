const User = require('../../models/user')

module.exports = {
    favourites: async (args, req)=>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not Authorised')
            error.code = 401
            throw error
        }
        const user = await User.findById(req.session.user._id).populate("favourite.items.productId")
        return {
            ...user.favourite
        }
    },
    addToFavourite: async({prodId}, req)=>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not Authorised')
            error.code = 401
            throw error
        } 
        if(!prodId){
            const error = new Error('Product id is invalid')
            error.code = 422
            throw error
        }
        const user = await User.findById(req.session.user._id)
        const isProdExist = user.favourite.items?.find(prod => prod.productId.toString() === prodId)
        if(isProdExist){
            const error = new Error('Product is already there in Favourite')
            error.code = 400
            throw error
        }
        const favourite = user.favourite.items
        const updateFavourite = [ ...favourite, { productId: prodId }]
        user.favourite.items = updateFavourite
        const result = await user.save()
        return {
            message: 'Successfully added the product to favourite',
            status: 200,
            productId: prodId

        }
    },
    deleteFavourite: async ({prodId}, req) =>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not Authorised')
            error.code = 401
            throw error
        } 
        if(!prodId){
            const error = new Error('Product id is invalid')
            error.code = 422
            throw error
        }
        const user = await User.findById(req.session.user._id)
        const isProdExist = user.favourite.items?.find(prod => prod.productId.toString() === prodId)
        if(!isProdExist){
            const error = new Error('Invalid productId provided')
            error.code = 400
            throw error
        }
        const favourite = user.favourite.items
        const updateFavourite = favourite.filter(prod => prod.productId?.toString() !== prodId )
        user.favourite.items = updateFavourite
        await user.save()
        return {
            message: 'Successfully deleted the product from favourite',
            status: 200

        }
    }
}