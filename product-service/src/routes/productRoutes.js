const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// GET all products
router.get('/', productController.getAllProducts);

// GET a single product by ID
router.get('/:id', productController.getProductById);

// POST create a new product
router.post('/', productController.createProduct);

// PUT update a product
router.put('/:id', productController.updateProduct);

// DELETE a product
router.delete('/:id', productController.deleteProduct);

// PUT update product stock
router.put('/:id/stock', productController.updateStock);

module.exports = router;