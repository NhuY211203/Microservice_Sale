const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 8002;
const DB_URI = process.env.DB_URI || 'mongodb://mongo-order:27017/order-service';

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(DB_URI)
  .then(() => console.log('Connected to Order MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Routes
app.use('/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Order Service is up and running!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});