const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// GET all orders
router.get('/', orderController.getAllOrders);

// GET a single order by ID
router.get('/:id', orderController.getOrderById);

// GET orders by customer ID
router.get('/customer/:customerId', orderController.getOrdersByCustomer);

// POST create a new order
router.post('/', orderController.createOrder);

// PUT update order status
router.put('/:id/status', orderController.updateOrderStatus);

// PUT cancel an order
router.put('/:id/cancel', orderController.cancelOrder);

module.exports = router;