const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const customerRoutes = require('./routes/customerRoutes');
const { subscribeToKafka } = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 8003;
const DB_URI = process.env.DB_URI || 'mongodb://mongo-customer:27017/customer-service';

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(DB_URI)
  .then(() => console.log('Connected to Customer MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Routes
app.use('/customers', customerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Customer Service is up and running!' });
});

// Subscribe to Kafka topics
subscribeToKafka();

// Start the server
app.listen(PORT, () => {
  console.log(`Customer Service running on port ${PORT}`);
});