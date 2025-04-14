const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { Kafka } = require('kafkajs');

const productRoutes = require('./routes/productRoutes');
const { subscribeToKafka } = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 8001;
const DB_URI = process.env.DB_URI || 'mongodb://mongo-product:27017/product-service';

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(DB_URI)
  .then(() => console.log('Connected to Product MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Routes
app.use('/products', productRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Product Service is up and running!' });
});

// Subscribe to Kafka topics
subscribeToKafka();

// Start the server
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});