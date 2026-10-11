const mongoose = require('mongoose')
require('dotenv').config({ quiet: true })

const User = require('../../models/user')
const Product = require('../../models/product')
const Order = require('../../models/order')
const orderResolver = require('../resolver/order')

describe('Testing Order', function () {
    let user
    let otherUser
    let product
    let orders

    beforeAll(async function () {
        await mongoose.connect(
            `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@node.3l7dvs8.mongodb.net/test-shop-mongoose`,
            { useNewUrlParser: true, useUnifiedTopology: true }
        )
    })

    afterAll(async function () {
        await mongoose.disconnect()
    })

    beforeEach(async function () {
        orders = []
        user = await User.create({
            name: 'Order Test User',
            email: `order-test-${new mongoose.Types.ObjectId()}@example.com`,
            password: 'order-test-password',
            cart: { items: [] }
        })
        otherUser = await User.create({
            name: 'Other Order Test User',
            email: `other-order-test-${new mongoose.Types.ObjectId()}@example.com`,
            password: 'order-test-password',
            cart: { items: [] }
        })
        product = await Product.create({
            title: 'Order test product',
            price: 31,
            description: 'Order product description',
            imageUrl: 'https://example.com/order-product.png',
            userId: user._id
        })
    })

    afterEach(async function () {
        if (orders && orders.length) {
            await Order.deleteMany({ _id: { $in: orders.map(order => order._id) } })
        }
        if (user) {
            await Order.deleteMany({ 'user.userId': user._id })
            await User.deleteOne({ _id: user._id })
        }
        if (otherUser) {
            await Order.deleteMany({ 'user.userId': otherUser._id })
            await User.deleteOne({ _id: otherUser._id })
        }
        if (product) {
            await Product.deleteOne({ _id: product._id })
        }
    })

    function authenticatedRequest(account = user) {
        return {
            session: {
                isLoggedIn: true,
                user: account
            }
        }
    }

    describe('Get Orders', function () {
        it('rejects unauthorised requests', async function () {
            await expect(orderResolver.orders({}, { session: { isLoggedIn: false } }))
                .rejects.toThrow('Not authorised')
        })

        it('returns only orders belonging to the current user', async function () {
            const ownOrder = await Order.create({
                products: [{ product: { title: 'Own order item' }, quantity: 2 }],
                user: { name: user.name, userId: user._id }
            })
            const otherOrder = await Order.create({
                products: [{ product: { title: 'Other order item' }, quantity: 1 }],
                user: { name: otherUser.name, userId: otherUser._id }
            })
            orders.push(ownOrder, otherOrder)

            const result = await orderResolver.orders({}, authenticatedRequest())

            expect(result.message).toBe('Successfully fetched ordered')
            expect(result.orders).toHaveLength(1)
            expect(result.orders[0]._id.toString()).toBe(ownOrder._id.toString())
            expect(result.orders[0].products[0].quantity).toBe(2)
        })

        it('returns an empty list when the user has no orders', async function () {
            const result = await orderResolver.orders({}, authenticatedRequest())

            expect(result.orders).toHaveLength(0)
        })
    })

    describe('Place Order', function () {
        it('rejects unauthorised requests', async function () {
            await expect(orderResolver.postOrder({}, { session: { isLoggedIn: false } }))
                .rejects.toThrow('Not authorised')
        })

        it('rejects when the cart is empty', async function () {
            await expect(orderResolver.postOrder({}, authenticatedRequest()))
                .rejects.toThrow('No item in cart present')
            expect(await Order.find({ 'user.userId': user._id })).toHaveLength(0)
        })

        it('saves the order with populated product data and clears the cart', async function () {
            user.cart.items.push({ productId: product._id, quantity: 3 })
            await user.save()

            const result = await orderResolver.postOrder({}, authenticatedRequest())
            const savedOrder = await Order.findById(result.order._id)
            orders.push(savedOrder)
            const updatedUser = await User.findById(user._id)

            expect(result.message).toBe('Order placed successfully')
            expect(savedOrder.products).toHaveLength(1)
            expect(savedOrder.products[0].quantity).toBe(3)
            expect(savedOrder.products[0].product.title).toBe('Order test product')
            expect(savedOrder.user.userId.toString()).toBe(user._id.toString())
            expect(updatedUser.cart.items).toHaveLength(0)
        })
    })
})
