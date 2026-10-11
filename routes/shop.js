const path = require('path');
const express = require('express');
const isProtectedRoute = require('../util/protectRoute')

const shopController = require('../controllers/shop');

const router = express.Router();

router.post('/post-image', isProtectedRoute, shopController.postImage)
router.get('/order/:orderId', isProtectedRoute, shopController.getInvoice);


module.exports = router;
