const express = require('express');
const customerController = require('../controllers/customerController');

const router = express.Router();

// GET all customers
router.get('/', customerController.getAllCustomers);

// GET a single customer by ID
router.get('/:id', customerController.getCustomerById);

// POST create a new customer
router.post('/', customerController.createCustomer);

// PUT update a customer
router.put('/:id', customerController.updateCustomer);

// DELETE a customer
router.delete('/:id', customerController.deleteCustomer);

// POST add address to customer
router.post('/:id/addresses', customerController.addAddress);

// PUT update customer password
router.put('/:id/password', customerController.updatePassword);

module.exports = router;