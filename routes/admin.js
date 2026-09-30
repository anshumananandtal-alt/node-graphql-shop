const path = require('path');
const { addEditProductValidation } = require('../util/validations')
const express = require('express');

const adminController = require('../controllers/admin');

const isProtectedRoute = require('../util/protectRoute')

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', addEditProductValidation(), isProtectedRoute, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', addEditProductValidation(), adminController.postAddProduct);

router.get('/edit-product/:productId', isProtectedRoute, adminController.getEditProduct);

router.post('/edit-product', adminController.postEditProduct);

router.post('/delete-product', adminController.postDeleteProduct);

router.delete('/product/:productId', adminController.postDeleteAlterProduct);

module.exports = router;
