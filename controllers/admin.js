const Product = require('../models/product');
const { validationResult } = require('express-validator')
const { ObjectId } = require('mongodb')
const path = require('path') 
const rootDir = require('../util/path');
const fileHelper = require('../util/helper')
const ITEM_PER_PAGE = 1
exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    isAddError: false,
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: '',
    errorValidation: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req)
  if(!image){
    return   res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      isAddError: true,
      product: { 
        ...req.body
       },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: 'Error: File should be of jpg, png or jpeg format' ,
      errorValidation: []
    });
  }
  if(!errors.isEmpty()){
      return   res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      isAddError: true,
      product: { ...req.body },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors?.array()?.[0]?.msg ?? '',
      errorValidation: errors?.array()
    });
  }
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: image.path,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        isAddError: false,
        product: product,
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: '',
        errorValidation: []
      });
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  console.log('#file', image, errors)
  if(!errors.isEmpty()){
      return   res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing: true,
      isAddError: false,
      product: { ...req.body},
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors?.array()?.[0]?.msg ?? '',
      errorValidation: errors.array()
    });
  }
  Product.findById(prodId)
    .then(product => {
      console.log('#test', product.userId, req.session.user._id, image)
      if(product.userId?.toString() !== req.session.user._id?.toString()){
        return res.redirect('/')
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(image){
        const filePath = path.join(rootDir, prod.imageUrl)
        fileHelper.deleteFile(filePath)
        product.imageUrl = image.path
      }
      return product.save().then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });
};

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems = 0
  Product.find({ userId : req.session.user._id})
  .countDocuments()
  .then(numOfProduct =>{
    totalItems = numOfProduct
    return Product.find({ userId : req.session.user._id})
      .skip((page - 1) * ITEM_PER_PAGE )
      .limit(ITEM_PER_PAGE)
    // .select('title price -_id')
    // .populate('userId', 'name')
  })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasPrevPage : page > 1,
        hasNextPage: page* ITEM_PER_PAGE <  totalItems,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE)
      });
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });;
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findOne({_id: prodId})
  .then(product =>{
    if(!product){
      return next(new Error('Product Not Found'))
    }
    const filePath = path.join(rootDir, product.imageUrl)
    fileHelper.deleteFile(filePath)
    return Product.deleteOne({ _id: prodId, userId: req.session.user._id})
  })
  .then(() => {
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');
  })
  .catch(err =>{
    const error = new Error(err)
    error.httpStatusCode = 500
    // res.redirect('/error')
    next(error)
  });;
};

exports.postDeleteAlterProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findOne({_id: prodId})
  .then(product =>{
    if(!product){
      return next(new Error('Product Not Found'))
    }
    const filePath = path.join(rootDir, product.imageUrl)
    fileHelper.deleteFile(filePath)
    return Product.deleteOne({ _id: prodId, userId: req.session.user._id})
  })
  .then(() => {
    console.log('DESTROYED PRODUCT');
    res.status(200).json({ message: 'Success fully deleted file'})
  })
  .catch(err =>{
    res.status(500).json({ message: 'Failed to delete the product'})
    const error = new Error(err)
    error.httpStatusCode = 500
    // res.redirect('/error')
    next(error)
  });;
};

