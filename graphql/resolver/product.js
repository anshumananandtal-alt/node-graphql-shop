const Product = require('../../models/product')
const User = require('../../models/user')
const path = require('path')
const rootDir = require('../../util/path')
const validator = require('validator')
const { deleteFile } = require('../../util/helper')
const {deleteImage} = require('../../util/awsService')
const PER_PAGE = 2
module.exports = {
    product: async ({ _id }, req) =>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const product = await Product.findById(_id).populate("userId")
        if(!product){
            const error = new Error('Product not found')
            error.code = 404
            throw error
        }
        return {
            ...product._doc,
            _id: product._id.toString()
        }
    },
    products: async({page}, req) =>{
        const currentPage = page ?? 1
        if(!req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const productCount = await Product.find().countDocuments()
        const products = await Product.find().skip((currentPage - 1) * PER_PAGE).limit(PER_PAGE).populate('userId')
        return { 
            products, 
            totalPages: Math.ceil(productCount / PER_PAGE)
        }
    },
    addProduct: async({ userInput}, req)=>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const title = userInput.title
        const price = userInput.price
        const imageUrl = userInput.imageUrl
        const description = userInput.description
        const errors = []
        if(validator.isEmpty(title) || !validator.isLength(title, { min: 5})){
            errors.push({ message: 'Invalid title'})
        }
        if(validator.isEmpty(imageUrl)){
            errors.push({ message: 'Invalid imageUrl'})
        }
        if(validator.isEmpty(description) || !validator.isLength(description, { min: 5})){
            errors.push({ message: 'Invalid description'})
        }
        if(!validator.isFloat(String(price), { min: 0})){
            errors.push({ message: 'Invalid price'})
        }
        if(errors.length){
            const err = new Error('Invalid input')
            err.code = 422
            err.data = errors
            throw err
        }
        const product = new Product({
            title,
            imageUrl,
            price,
            description,
            userId: req.session.user
        })
        const savedProduct = await product.save()
        return {
            message: 'Successfully added Product',
            product: { ...savedProduct._doc, _id: savedProduct._id.toString(), userId: savedProduct.userId.toString()}
        }
    },
    editProduct: async({ prodId, userInput}, req) => {
        if(!req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const title = userInput.title
        const price = userInput.price
        const imageUrl = userInput.imageUrl
        const description = userInput.description
        const errors = []
        if(validator.isEmpty(title) || !validator.isLength(title, { min: 5})){
            errors.push({ message: 'Invalid title'})
        }
        if(validator.isEmpty(imageUrl)){
            errors.push({ message: 'Invalid imageUrl'})
        }
        if(validator.isEmpty(description) || !validator.isLength(description, { min: 5})){
            errors.push({ message: 'Invalid description'})
        }
        if(!validator.isFloat(String(price), { min: 0})){
            errors.push({ message: 'Invalid price'})
        }
        if(errors.length){
            const err = new Error('Invalid input')
            err.code = 422
            err.data = errors
            throw err
        }
        const product = await Product.findById(prodId)
        if(!product){
            const err = new Error('Product not found')
            err.code = 404
            throw err
        }
        if(product.userId.toString() !== req.session.user._id.toString()){
            const err = new Error('Not authorised')
            err.code = 401
            throw err
        }
        product.title = title
        product.description = description
        product.price = price
        if(imageUrl){
            product.imageUrl = imageUrl
        }
        const productResult = await product.save()
        return {
            message: 'Successfully updated product',
            product: {
                ...productResult._doc,
                 _id: productResult._id.toString(), 
                 userId: productResult.userId.toString()
            }
        }
    },
    deleteProduct: async ({ _id}, req) =>{
        if(!req.session.isLoggedIn){
            const error = new Error('Not authorised')
            error.code = 401
            throw error
        }
        const product = await Product.findById(_id)
        if(!product){
            const error = new Error('No product found')
            error.code = 404
            throw error
        }
        if(product.userId.toString() !== req.session.user._id.toString()){
            const err = new Error('Not authorised')
            err.code = 401
            throw err
        }
        try{
            const deleteResult = await Product.findByIdAndDelete(_id)
            const deleteImageResult = await deleteImage(product.imageUrl)
            const deleteFromUserCart = await User.updateMany(
                {         
                    $or: [
                        { 'cart.items.productId': _id },
                        { 'favourite.items.productId': _id }
                    ]
                },
                {
                    $pull: {
                        'cart.items': {
                            productId: _id
                        },
                        'favourite.items': {
                               productId: _id
                        }
                    }
                } 
            );
            // const fileLocation = path.join(rootDir, product.imageUrl)
            // deleteFile(fileLocation)
            return {
                message: 'Successfully deleted product',
                status: 200       
            }
        }catch(err){
            err.code = 500
            throw err
        }
    }
}