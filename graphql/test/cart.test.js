const mongoose = require('mongoose')
require('dotenv').config({ quiet: true })

const User = require('../../models/user')
const Product = require('../../models/product')
const CartResolver = require('../resolver/cart')

describe('Testing Cart', function () {
    let user
    let products

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
        products = []
        user = await User.create({
            name: 'Cart Test User',
            email: `cart-test-${new mongoose.Types.ObjectId()}@example.com`,
            password: 'cart-test-password',
            cart: { items: [] }
        })
        products.push(await Product.create({
            title: 'Cart test product one',
            price: 10,
            description: 'Cart test product description',
            imageUrl: 'https://example.com/cart-test-one.png',
            userId: user._id
        }))
        products.push(await Product.create({
            title: 'Cart test product two',
            price: 20,
            description: 'Another cart test product description',
            imageUrl: 'https://example.com/cart-test-two.png',
            userId: user._id
        }))
    })

    afterEach(async function () {
        if (user) {
            await User.deleteOne({ _id: user._id })
        }
        if (products && products.length) {
            await Product.deleteMany({ _id: { $in: products.map(product => product._id) } })
        }
    })

    function authenticatedRequest() {
        return {
            session: {
                isLoggedIn: true,
                user: { _id: user._id }
            }
        }
    }

    describe('Get Cart', function () {
        it('throws when the user is not authorised', async function () {
            await expect(CartResolver.carts({}, {})).rejects.toThrow('Not authorised')
        })

        it('returns the user cart with real populated product data', async function () {
            user.cart.items.push({ productId: products[0]._id, quantity: 2 })
            await user.save()

            const cart = await CartResolver.carts({}, authenticatedRequest())

            expect(cart.items).toHaveLength(1)
            expect(cart.items[0].quantity).toBe(2)
            expect(cart.items[0].productId._id.toString()).toBe(products[0]._id.toString())
            expect(cart.items[0].productId.title).toBe('Cart test product one')
        })

        it('returns an empty cart when the user has no cart items', async function () {
            const cart = await CartResolver.carts({}, authenticatedRequest())

            expect(cart.items).toHaveLength(0)
        })
    })

    describe('Delete Cart', function () {
        it('throws when the user is not authorised', async function () {
            await expect(
                CartResolver.deleteCart({ productId: products[0]._id.toString() }, {})
            ).rejects.toThrow('Not authorised')
        })

        it('removes the requested product from the persisted cart', async function () {
            user.cart.items.push(
                { productId: products[0]._id, quantity: 1 },
                { productId: products[1]._id, quantity: 2 }
            )
            await user.save()

            const result = await CartResolver.deleteCart(
                { productId: products[0]._id.toString() },
                authenticatedRequest()
            )
            const updatedUser = await User.findById(user._id)

            expect(result).toEqual({
                message: 'Successfully removed product from cart',
                status: 200
            })
            expect(updatedUser.cart.items).toHaveLength(1)
            expect(updatedUser.cart.items[0].productId.toString()).toBe(products[1]._id.toString())
        })

        it('leaves the cart unchanged when the product is not present', async function () {
            user.cart.items.push({ productId: products[0]._id, quantity: 1 })
            await user.save()

            await CartResolver.deleteCart(
                { productId: products[1]._id.toString() },
                authenticatedRequest()
            )
            const updatedUser = await User.findById(user._id)

            expect(updatedUser.cart.items).toHaveLength(1)
            expect(updatedUser.cart.items[0].productId.toString()).toBe(products[0]._id.toString())
        })
    })

    describe('Add To Cart', function () {
        it('throws when the user is not authorised', async function () {
            await expect(
                CartResolver.addToCart({ productId: products[0]._id.toString() }, {})
            ).rejects.toThrow('Not authorised')
        })

        it('adds a new product to the persisted cart with quantity one', async function () {
            const result = await CartResolver.addToCart(
                { productId: products[0]._id.toString() },
                authenticatedRequest()
            )
            const updatedUser = await User.findById(user._id)

            expect(result).toEqual({
                message: 'Successfully add product to cart',
                status: 200
            })
            expect(updatedUser.cart.items).toHaveLength(1)
            expect(updatedUser.cart.items[0].productId.toString()).toBe(products[0]._id.toString())
            expect(updatedUser.cart.items[0].quantity).toBe(1)
        })

        it('increments the quantity when the product is already in the cart', async function () {
            user.cart.items.push({ productId: products[0]._id, quantity: 2 })
            await user.save()

            await CartResolver.addToCart(
                { productId: products[0]._id.toString() },
                authenticatedRequest()
            )
            const updatedUser = await User.findById(user._id)

            expect(updatedUser.cart.items).toHaveLength(1)
            expect(updatedUser.cart.items[0].quantity).toBe(3)
        })
    })
})
