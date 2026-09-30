const path = require('path')
const fs = require('fs')
const Stripe = require('stripe')
const rootDir = require('../util/path')
const Product = require('../models/product');
const Order = require('../models/order');
const PdfDocument = require('pdfkit')
const ITEM_PER_PAGE = 1
exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems = 0
  Product.find(req?.session?.user?._id ? { userId : req.session.user._id}: {})
  .countDocuments()
  .then(numOfProduct =>{
    totalItems = numOfProduct
    return Product.find(req?.session?.user?._id ? { userId : req.session.user._id} : {})
      .skip((page - 1) * ITEM_PER_PAGE )
      .limit(ITEM_PER_PAGE)
    // .select('title price -_id')
    // .populate('userId', 'name')
  })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
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

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });;
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1
  let totalItems = 0
  Product.find(req?.user?._id ? { userId : req?.user?._id}: {})
  .countDocuments()
  .then(numOfProduct =>{
    totalItems = numOfProduct
    return Product.find(req?.user?._id ? { userId : req.user._id}: {})
      .skip((page - 1) * ITEM_PER_PAGE )
      .limit(ITEM_PER_PAGE)
    // .select('title price -_id')
    // .populate('userId', 'name')
  })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
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

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });;
};

exports.getCheckout  = (req, res, next) => {
  let products = []
  let totalPrice = 0
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      totalPrice = products.reduce((currValue, itr, index)=> currValue + itr.quantity * + itr.productId.price, 0)
      return new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: products.map(prod => ({
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
        success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`
      })
    }).then(session =>{
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Your Checkout',
        products: products,
        public_key: process.env.STRIPE_PUBLIC_KEY,
        totalPrice,
        isAuthenticated: req.session.isLoggedIn,
        sessionId: session.id
      });
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });;
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });;
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err =>{
      const error = new Error(err)
      error.httpStatusCode = 500
      // res.redirect('/error')
      next(error)
    });;
};

exports.getInvoice = (req, res, next) =>{
  const orderId = req.params.orderId
  Order.findById(orderId)
  .then(order =>{
    console.log('#order', order)
    if(!order){
      throw new Error('No order found with that orderId')
    }
    if(order.user.userId?.toString() !== req.session.user._id.toString()){
      throw new Error('Access Denied')
    }
    const fileName = `invoice-${orderId}.pdf`
    const filePath = path.join(rootDir, 'data', 'invoices', fileName)

    // fs.readFile(filePath, (err, data)=>{
    //   if(err){
    //     return next(err)
    //   }
    // const file = fs.createReadStream(filePath)
      res.setHeader(
        'Content-Type', 'application/pdf')
    //   // res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
      res.setHeader("Content-Disposition", `inline; filename=${fileName}`)

    //   return file.pipe(res)
    const pdfDoc = new  PdfDocument()
    pdfDoc.pipe(fs.createWriteStream(filePath))
    pdfDoc.pipe(res)
    pdfDoc.fontSize(20).text(
      `Invoice For Order: ${orderId}`,
      {
        underline: true
      }
    )
    pdfDoc.fontSize(22).text('--------------------------')
    let total = 0
    order.products.forEach(product =>{
      total += product.product.price * product.quantity
      pdfDoc.fontSize(16).text(`${product.product.title} : ${product.quantity} x  $${product.product.price}`)
    })
    pdfDoc.fontSize(22).text('--------------------------')
    pdfDoc.fontSize(18).text(`Total Price: $${total}`)
    pdfDoc.end()
    // })
  })
  .catch(err => next(err))
 
}
