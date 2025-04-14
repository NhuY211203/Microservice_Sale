const { Kafka } = require('kafkajs');
const Product = require('../models/Product');

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'product-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'product-service-group' });

// Handle order created event
const handleOrderCreated = async (message) => {
  try {
    const orderData = JSON.parse(message.value.toString());
    console.log('Processing order:', orderData.orderId);
    
    // Update product stock for each item in the order
    for (const item of orderData.items) {
      const product = await Product.findById(item.productId);
      
      if (product) {
        product.stock -= item.quantity;
        await product.save();
        console.log(`Updated stock for product ${item.productId}, new stock: ${product.stock}`);
      } else {
        console.error(`Product ${item.productId} not found`);
      }
    }
  } catch (error) {
    console.error('Error processing order created event:', error);
  }
};

// Subscribe to Kafka topics
const subscribeToKafka = async () => {
  try {
    await consumer.connect();
    console.log('Connected to Kafka consumer');
    
    // Subscribe to order-created topic
    await consumer.subscribe({ topic: 'order-created', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        switch (topic) {
          case 'order-created':
            await handleOrderCreated(message);
            break;
          default:
            console.log(`No handler for topic ${topic}`);
        }
      }
    });
  } catch (error) {
    console.error('Failed to connect to Kafka consumer:', error);
  }
};

module.exports = { subscribeToKafka };