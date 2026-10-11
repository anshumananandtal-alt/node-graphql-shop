const mongoose = require('mongoose')
require('dotenv').config({ quiet: true })

const User = require('../../models/user')
const Product = require('../../models/product')
const productResolver = require('../resolver/product')

describe('Testing Product', function () {
    let user
    let otherUser
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
            name: 'Product Test User',
            email: `product-test-${new mongoose.Types.ObjectId()}@example.com`,
            password: 'product-test-password',
            cart: { items: [] }
        })
        otherUser = await User.create({
            name: 'Other Product Test User',
            email: `other-product-test-${new mongoose.Types.ObjectId()}@example.com`,
            password: 'product-test-password',
            cart: { items: [] }
        })
        products.push(await Product.create({
            title: 'Owned test product',
            price: 12,
            description: 'Owned product description',
            imageUrl: 'https://example.com/owned-product.png',
            userId: user._id
        }))
        products.push(await Product.create({
            title: 'Other user product',
            price: 18,
            description: 'Other product description',
            imageUrl: 'https://example.com/other-product.png',
            userId: otherUser._id
        }))
    })

    afterEach(async function () {
        if (products && products.length) {
            await Product.deleteMany({ _id: { $in: products.map(product => product._id) } })
        }
        if (user) {
            await User.deleteOne({ _id: user._id })
        }
        if (otherUser) {
            await User.deleteOne({ _id: otherUser._id })
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

    const validProductInput = {
        title: 'Updated test product',
        price: 25,
        description: 'Updated product description',
        imageUrl: 'https://example.com/updated-product.png'
    }

    describe('Get Product', function () {
        it('rejects unauthorised requests', async function () {
            await expect(productResolver.product(
                { _id: products[0]._id.toString() },
                { session: { isLoggedIn: false } }
            )).rejects.toThrow('Not authorised')
        })

        it('returns an existing product', async function () {
            const result = await productResolver.product(
                { _id: products[0]._id.toString() },
                authenticatedRequest()
            )

            expect(result._id).toBe(products[0]._id.toString())
            expect(result.title).toBe('Owned test product')
            expect(result.price).toBe(12)
        })

        it('throws when the product does not exist', async function () {
            await expect(productResolver.product(
                { _id: new mongoose.Types.ObjectId().toString() },
                authenticatedRequest()
            )).rejects.toThrow('Product not found')
        })
    })

    describe('Get Products', function () {
        it('rejects unauthorised requests', async function () {
            await expect(productResolver.products({}, { session: { isLoggedIn: false } }))
                .rejects.toThrow('Not authorised')
        })

        it('returns only the current user products with populated owners', async function () {
            const result = await productResolver.products({}, authenticatedRequest())

            expect(result).toHaveLength(1)
            expect(result[0]._id.toString()).toBe(products[0]._id.toString())
            expect(result[0].userId.name).toBe('Product Test User')
        })
    })

    describe('Add Product', function () {
        it('rejects unauthorised requests', async function () {
            await expect(productResolver.addProduct(
                { userInput: validProductInput },
                { session: { isLoggedIn: false } }
            )).rejects.toThrow('Not authorised')
        })

        it('persists a valid product for the current user', async function () {
            const result = await productResolver.addProduct(
                { userInput: validProductInput },
                authenticatedRequest()
            )
            products.push(await Product.findById(result.product._id))
            const savedProduct = await Product.findById(result.product._id)

            expect(result.message).toBe('Successfully added Product')
            expect(savedProduct.title).toBe(validProductInput.title)
            expect(savedProduct.userId.toString()).toBe(user._id.toString())
            expect(savedProduct.price).toBe(validProductInput.price)
        })

        it('rejects invalid product input without persisting a product', async function () {
            await expect(productResolver.addProduct(
                { userInput: { ...validProductInput, title: 'bad', price: -1 } },
                authenticatedRequest()
            )).rejects.toThrow('Invalid input')

            expect(await Product.findOne({ title: 'bad', userId: user._id })).toBeNull()
        })
    })

    describe('Edit Product', function () {
        it('rejects unauthorised requests', async function () {
            await expect(productResolver.editProduct(
                { prodId: products[0]._id.toString(), userInput: validProductInput },
                { session: { isLoggedIn: false } }
            )).rejects.toThrow('Not authorised')
        })

        it('persists updates to an owned product', async function () {
            const result = await productResolver.editProduct(
                { prodId: products[0]._id.toString(), userInput: validProductInput },
                authenticatedRequest()
            )
            const updatedProduct = await Product.findById(products[0]._id)

            expect(result.message).toBe('Successfully updated product')
            expect(updatedProduct.title).toBe(validProductInput.title)
            expect(updatedProduct.description).toBe(validProductInput.description)
            expect(updatedProduct.price).toBe(validProductInput.price)
            expect(updatedProduct.imageUrl).toBe(validProductInput.imageUrl)
        })

        it('rejects edits to products owned by another user', async function () {
            await expect(productResolver.editProduct(
                { prodId: products[1]._id.toString(), userInput: validProductInput },
                authenticatedRequest()
            )).rejects.toThrow('Not authorised')
        })

        it('throws when the product does not exist', async function () {
            await expect(productResolver.editProduct(
                { prodId: new mongoose.Types.ObjectId().toString(), userInput: validProductInput },
                authenticatedRequest()
            )).rejects.toThrow('Product not found')
        })
    })

    describe('Delete Product', function () {
        it('rejects unauthorised requests', async function () {
            await expect(productResolver.deleteProduct(
                { _id: products[0]._id.toString() },
                { session: { isLoggedIn: false } }
            )).rejects.toThrow('Not authorised')
        })

        it('deletes an owned product and removes it from user carts', async function () {
            user.cart.items.push({ productId: products[0]._id, quantity: 2 })
            await user.save()

            const result = await productResolver.deleteProduct(
                { _id: products[0]._id.toString() },
                authenticatedRequest()
            )
            const updatedUser = await User.findById(user._id)

            expect(result).toEqual({
                message: 'Successfully deleted product',
                status: 200
            })
            expect(await Product.findById(products[0]._id)).toBeNull()
            expect(updatedUser.cart.items).toHaveLength(0)
        })

        it('rejects deletion of products owned by another user', async function () {
            await expect(productResolver.deleteProduct(
                { _id: products[1]._id.toString() },
                authenticatedRequest()
            )).rejects.toThrow('Not authorised')
        })

        it('throws when the product does not exist', async function () {
            await expect(productResolver.deleteProduct(
                { _id: new mongoose.Types.ObjectId().toString() },
                authenticatedRequest()
            )).rejects.toThrow('No product found')
        })
    })
})
