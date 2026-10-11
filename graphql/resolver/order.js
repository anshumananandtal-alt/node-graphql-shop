
const User = require('../../models/user')
const Order = require('../../models/order')
const Stripe = require('stripe')
module.exports = {
    orders: async (args , req)=>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const orders = await Order.find({ "user.userId": req.session.user._id  })
        return {
            message: 'Successfully fetched ordered',
            orders
        }
    },
    postOrder: async ({ sessionId }, req)=>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sessionId)
        const user = await User
            .findById(req.session.user._id)
            .populate('cart.items.productId');

        if (!user?.cart?.items?.length) {
            const error = new Error('No item in cart present');
            error.code = 422;
            throw error;
        }
        if (
            session.status !== 'complete' ||
            session.payment_status !== 'paid'
        ){
            const error = new Error(
                'Payment has not been completed or confirmed.'
            );
            error.code = 402;
            throw error;
        }
        const order = new Order({
            products: user.cart.items.map(item =>({
                quantity: item.quantity, product: { ...item.productId._doc }
            })),
            user: { name: req.session.user._id, userId: req.session.user}
        })
        const orderResult = await order.save()
        user.cart.items = []
        await user.save()
        return {
            order: orderResult._doc,
            message: "Order placed successfully"
        }
    }
}