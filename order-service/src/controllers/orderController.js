const Order = require('../models/Order');
const axios = require('axios');
const { produceMessage } = require('../kafka/producer');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:8001';
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://customer-service:8003';

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Get orders by customer ID
exports.getOrdersByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const orders = await Order.find({ customerId });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Error fetching customer orders', error: error.message });
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { customerId, items, shippingAddress } = req.body;
    
    // Validate customer exists
    try {
      const customerResponse = await axios.get(`${CUSTOMER_SERVICE_URL}/customers/${customerId}`);
      if (!customerResponse.data) {
        return res.status(404).json({ message: 'Customer not found' });
      }
    } catch (error) {
      console.error('Error validating customer:', error);
      return res.status(500).json({ 
        message: 'Error validating customer',
        error: error.response?.data || error.message
      });
    }
    
    // Check product availability and calculate total
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      try {
        // Get product details
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
        const product = productResponse.data;
        
        // Check if product exists and has enough stock
        if (!product) {
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product ${product.name}`,
            requestedQuantity: item.quantity,
            availableStock: product.stock
          });
        }
        
        // Calculate item total and add to order total
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        
        // Add to order items
        orderItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        });
        
      } catch (error) {
        console.error(`Error processing product ${item.productId}:`, error);
        return res.status(500).json({ 
          message: `Error processing product ${item.productId}`,
          error: error.response?.data || error.message
        });
      }
    }
    
    // Create the order
    const order = new Order({
      customerId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      status: 'pending'
    });
    
    const savedOrder = await order.save();
    
    // Send order created event to Kafka
    await produceMessage('order-created', {
        orderId: savedOrder._id,
        customerId: savedOrder.customerId,
        items: savedOrder.items,
        status: savedOrder.status,
        totalAmount: savedOrder.totalAmount
      });
      
      res.status(201).json(savedOrder);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Error creating order', error: error.message });
    }
  };
  
  // Update order status
  exports.updateOrderStatus = async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Send order updated event to Kafka
      await produceMessage('order-updated', {
        orderId: order._id,
        status: order.status
      });
      
      res.status(200).json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
  };
  
  // Cancel order
  exports.cancelOrder = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Only allow cancellation if order is pending or processing
      if (!['pending', 'processing'].includes(order.status)) {
        return res.status(400).json({ 
          message: `Cannot cancel order with status: ${order.status}`,
          allowedStatusForCancellation: ['pending', 'processing']
        });
      }
      
      order.status = 'cancelled';
      await order.save();
      
      // Send order cancelled event to Kafka
      await produceMessage('order-cancelled', {
        orderId: order._id,
        items: order.items
      });
      
      res.status(200).json(order);
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Error cancelling order', error: error.message });
    }
  };