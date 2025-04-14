const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes for Product Service
app.use('/api/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:8001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/products'
  }
}));

// Routes for Order Service
app.use('/api/orders', createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:8002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/orders'
  }
}));

// Routes for Customer Service
app.use('/api/customers', createProxyMiddleware({
  target: process.env.CUSTOMER_SERVICE_URL || 'http://customer-service:8003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/customers': '/customers'
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Gateway is up and running!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});