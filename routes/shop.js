const path = require('path');
const express = require('express');
const isProtectedRoute = require('../util/protectRoute')

const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isProtectedRoute, shopController.getCart);
router.get('/checkout', isProtectedRoute, shopController.getCheckout);


router.post('/cart', shopController.postCart);

router.post('/cart-delete-item', shopController.postCartDeleteProduct);

router.post('/create-order', shopController.postOrder);
router.get('/checkout/success', shopController.postOrder);
router.get('/checkout/cancel', shopController.getCheckout);


router.get('/orders', isProtectedRoute, shopController.getOrders);
router.get('/order/:orderId', isProtectedRoute, shopController.getInvoice);


module.exports = router;
