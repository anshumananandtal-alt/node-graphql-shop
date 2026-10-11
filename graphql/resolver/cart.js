const session = require('express-session')
const User = require('../../models/user')
const Stripe = require('stripe')
module.exports = {
    carts: async (args, req) =>{
        if(!req.session || !req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const user = await User.findById(req.session.user._id).populate('cart.items.productId')
        return {
            ...user.cart
        }
    },
    checkout: async (args, req)=>{
        if(!req.session || !req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const user = await User.findById(req.session.user._id).populate('cart.items.productId')
        const session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: user?.cart?.items.map(prod => ({
            price_data: {
                currency: 'usd',
                product_data: {
                name: prod.productId.title,
                description: prod.productId.description
                },
                unit_amount: prod.productId.price * 100
            },
            quantity: prod.quantity
            })),
            success_url: `${req.protocol}://localhost:5173/checkout/success/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://localhost:5173/checkout/fail`
        })
        return {
            ...user.cart,
            sessionId: session.id,
            url: session.url
        }
    },
    deleteCart: async ({ productId }, req)=>{
        if(!req.session || !req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error 
        }
        try{
            const user = await User.findById(req.session.user._id)
            const userCart = user.cart
            const modifiedCart = userCart.items.filter(cartItem => cartItem.productId.toString() !== productId)
            user.cart.items = modifiedCart
            const deleteResult = await user.save()
            return {
                message: 'Successfully removed product from cart',
                status: 200
            }
        }catch(err){
            err.code = 500
            throw err
        }  
    },
    addToCart: async ({ productId }, req)=>{
        if(!req.session || !req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        try{
            const user = await User.findById(req.session.user._id)
            const userCart = user.cart
            const cartItems = userCart.items
            const isProductExist = userCart.items.findIndex(cartItem => cartItem.productId.toString() === productId)
            if(isProductExist>= 0){
                cartItems[isProductExist] = { productId, quantity: +cartItems[isProductExist].quantity + 1}
            }else{
                cartItems.push({ productId: productId, quantity: 1})
            }
            user.cart.items = cartItems
            const addResult = await user.save()
            return {
                message: 'Successfully add product to cart',
                status: 200
            }
        }catch(err){
            err.code = 500
            throw err
        }  
    }
}